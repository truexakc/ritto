/**
 * Order Validation Service
 * 
 * Validates order data against SABY Service catalog:
 * - Validates product existence
 * - Validates product availability
 * - Recomputes prices from actual catalog
 * - Compares frontend vs backend prices
 * - Logs price mismatches for monitoring
 * 
 * Security: NEVER trust frontend-provided prices
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

const SABY_SERVICE_URL = process.env.SABY_SERVICE_URL || 'http://saby-service:8080';
const CATALOG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Simple in-memory cache for catalog
let catalogCache = {
  data: null,
  timestamp: null
};

/**
 * Fetches the product catalog from SABY Service
 * Uses optional caching to reduce load on SABY Service
 * 
 * @returns {Promise<Array>} Array of products from catalog
 * @throws {AppError} If SABY Service is unavailable
 */
async function fetchCatalog() {
  // Check cache first
  const now = Date.now();
  if (catalogCache.data && catalogCache.timestamp && (now - catalogCache.timestamp) < CATALOG_CACHE_TTL) {
    logger.debug('Using cached catalog');
    return catalogCache.data;
  }

  try {
    logger.info('Fetching catalog from SABY Service:', `${SABY_SERVICE_URL}/api/catalog`);
    const response = await axios.get(`${SABY_SERVICE_URL}/api/catalog`, {
      timeout: 10000 // 10 second timeout
    });

    if (!response.data || !Array.isArray(response.data)) {
      throw new AppError(
        'SABY_SERVICE_UNAVAILABLE',
        'Invalid catalog response format',
        503
      );
    }

    // Update cache
    catalogCache.data = response.data;
    catalogCache.timestamp = now;

    logger.info(`Catalog fetched successfully: ${response.data.length} products`);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch catalog from SABY Service:', error.message);
    
    // If we have stale cache, use it as fallback
    if (catalogCache.data) {
      logger.warn('Using stale catalog cache as fallback');
      return catalogCache.data;
    }
    
    // Throw AppError for SABY Service unavailability
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      'SABY_SERVICE_UNAVAILABLE',
      'Product catalog is temporarily unavailable. Please try again later.',
      503
    );
  }
}

/**
 * Validates order items against catalog and recomputes prices
 * 
 * @param {Array} orderItems - Array of order items with product_id, quantity, price
 * @param {number} frontendTotal - Total price calculated by frontend
 * @returns {Promise<Object>} Validation result with recomputed prices
 * 
 * Result format:
 * {
 *   valid: boolean,
 *   errors: Array<string>,
 *   validatedItems: Array<Object>,
 *   actualTotal: number,
 *   frontendTotal: number,
 *   priceMismatch: boolean
 * }
 */
async function validateOrderAndRecomputePrice(orderItems, frontendTotal) {
  const result = {
    valid: true,
    errors: [],
    validatedItems: [],
    actualTotal: 0,
    frontendTotal: frontendTotal,
    priceMismatch: false
  };

  // Validate input
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    result.valid = false;
    result.errors.push('Order must contain at least one item');
    return result;
  }

  try {
    // Fetch current catalog
    const catalog = await fetchCatalog();
    
    // Create product lookup map for efficient searching
    const productMap = new Map();
    catalog.forEach(product => {
      productMap.set(product.id || product.product_id, product);
    });

    // Validate each item and recompute price
    for (const item of orderItems) {
      const { product_id, quantity, price: frontendPrice } = item;

      // Validate required fields
      if (!product_id) {
        result.valid = false;
        result.errors.push('Product ID is required for all items');
        continue;
      }

      if (!quantity || quantity < 1) {
        result.valid = false;
        result.errors.push(`Invalid quantity for product ${product_id}`);
        continue;
      }

      // Check if product exists in catalog
      const catalogProduct = productMap.get(product_id);
      if (!catalogProduct) {
        result.valid = false;
        result.errors.push(`Product not found: ${product_id}`);
        logger.warn(`Order validation failed: Product ${product_id} not found in catalog`);
        continue;
      }

      // Check if product is available
      if (catalogProduct.available === false || catalogProduct.is_available === false) {
        result.valid = false;
        result.errors.push(`Product unavailable: ${catalogProduct.name || product_id}`);
        logger.warn(`Order validation failed: Product ${product_id} is not available`);
        continue;
      }

      // Get actual price from catalog
      const actualPrice = parseFloat(catalogProduct.price);
      if (isNaN(actualPrice) || actualPrice < 0) {
        result.valid = false;
        result.errors.push(`Invalid price for product: ${catalogProduct.name || product_id}`);
        logger.error(`Product ${product_id} has invalid price in catalog: ${catalogProduct.price}`);
        continue;
      }

      // Compare frontend price with actual price
      const frontendPriceNum = parseFloat(frontendPrice);
      if (Math.abs(frontendPriceNum - actualPrice) > 0.01) {
        logger.warn(`Price mismatch for product ${product_id}: frontend=${frontendPriceNum}, actual=${actualPrice}`);
        // Note: This is a warning, not an error - we use actual price
      }

      // Add validated item with actual price
      const validatedItem = {
        product_id: product_id,
        product_name: catalogProduct.name || catalogProduct.product_name || 'Unknown',
        quantity: parseInt(quantity),
        price: actualPrice, // Use actual price from catalog
        frontend_price: frontendPriceNum // Store frontend price for comparison
      };

      result.validatedItems.push(validatedItem);
      result.actualTotal += actualPrice * quantity;
    }

    // Round to 2 decimal places
    result.actualTotal = Math.round(result.actualTotal * 100) / 100;

    // Check for price mismatch between frontend and backend totals
    if (Math.abs(result.actualTotal - frontendTotal) > 0.01) {
      result.priceMismatch = true;
      logger.warn(`Total price mismatch: frontend=${frontendTotal}, actual=${result.actualTotal}`);
      logger.warn('This could indicate price manipulation or stale catalog on frontend');
    }

  } catch (error) {
    result.valid = false;
    result.errors.push('Failed to validate order: ' + error.message);
    logger.error('Order validation error:', error);
  }

  return result;
}

/**
 * Validates phone number format
 * Phone must start with "+" and contain only digits after that
 * 
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidPhoneFormat(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Must start with +
  if (!phone.startsWith('+')) {
    return false;
  }
  
  // After +, must contain only digits
  const digitsOnly = phone.slice(1);
  return /^\d+$/.test(digitsOnly);
}

/**
 * Validates order data before sending to Saby
 * Checks required fields, formats, and business rules
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 * 
 * @param {Object} orderData - Order data to validate
 * @returns {Object} Validation result with errors array
 * 
 * Result format:
 * {
 *   valid: boolean,
 *   errors: Array<{field: string, message: string}>
 * }
 */
function validateOrderData(orderData) {
  const errors = [];
  
  // Requirement 7.1, 7.2: Check phone field
  if (!orderData.phone) {
    errors.push({ 
      field: 'phone', 
      message: 'Phone is required' 
    });
  } else if (!isValidPhoneFormat(orderData.phone)) {
    // Requirement 7.6: Validate phone format
    errors.push({ 
      field: 'phone', 
      message: 'Phone must start with + and contain only digits' 
    });
  }
  
  // Requirement 7.1: Check delivery_method field
  if (!orderData.delivery_method) {
    errors.push({ 
      field: 'delivery_method', 
      message: 'Delivery method is required' 
    });
  } else if (!['delivery', 'pickup'].includes(orderData.delivery_method)) {
    errors.push({ 
      field: 'delivery_method', 
      message: 'Delivery method must be "delivery" or "pickup"' 
    });
  }
  
  // Requirement 7.3: Check delivery_address when delivery_method is "delivery"
  if (orderData.delivery_method === 'delivery' && !orderData.delivery_address) {
    errors.push({ 
      field: 'delivery_address', 
      message: 'Delivery address is required for delivery method' 
    });
  }
  
  // Requirement 7.1, 7.4: Check items array
  if (!orderData.items) {
    errors.push({ 
      field: 'items', 
      message: 'Items array is required' 
    });
  } else if (!Array.isArray(orderData.items)) {
    errors.push({ 
      field: 'items', 
      message: 'Items must be an array' 
    });
  } else if (orderData.items.length === 0) {
    errors.push({ 
      field: 'items', 
      message: 'Order must contain at least one item' 
    });
  } else {
    // Requirement 7.5: Check nomNumber for each item
    orderData.items.forEach((item, index) => {
      if (!item.nomNumber) {
        errors.push({ 
          field: 'items', 
          message: `Product at index ${index} (ID: ${item.product_id || 'unknown'}) is missing nomNumber` 
        });
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Clears the catalog cache
 * Useful for testing or forcing fresh catalog fetch
 */
function clearCache() {
  catalogCache.data = null;
  catalogCache.timestamp = null;
  logger.debug('Catalog cache cleared');
}

module.exports = {
  validateOrderAndRecomputePrice,
  validateOrderData,
  isValidPhoneFormat,
  fetchCatalog,
  clearCache
};
