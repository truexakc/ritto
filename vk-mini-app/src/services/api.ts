/**
 * API Service
 * Handles communication with Backend API and SABY Service
 */

import type { Product } from '../types/product';
import type { OrderData, OrderResponse } from '../types/order';
import type { LaunchParams, VKUser } from '../types/vkBridge';

// API Configuration
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5001';
const SABY_SERVICE_URL = import.meta.env.VITE_SABY_SERVICE_URL || 'http://localhost:8080';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Error response from API
 */
interface APIError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Auth validation response
 */
interface AuthResponse {
  user: VKUser;
  valid: boolean;
}

/**
 * Generate UUID v4 for request ID
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Convert Launch Params to headers object
 */
function launchParamsToHeaders(launchParams: LaunchParams): Record<string, string> {
  return {
    'X-VK-User-Id': launchParams.vk_user_id.toString(),
    'X-VK-App-Id': launchParams.vk_app_id.toString(),
    'X-VK-Is-App-User': launchParams.vk_is_app_user.toString(),
    'X-VK-Are-Notifications-Enabled': launchParams.vk_are_notifications_enabled.toString(),
    'X-VK-Language': launchParams.vk_language,
    'X-VK-Platform': launchParams.vk_platform,
    'X-VK-Ts': launchParams.vk_ts.toString(),
    'X-VK-Sign': launchParams.sign,
  };
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Request failed, retrying... (${retries} retries left)`);
      await sleep(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

/**
 * API Service class
 */
class APIService {
  /**
   * Get product catalog from SABY Service
   * This is a public endpoint, no authentication required
   * @returns Promise with array of products
   */
  async getCatalog(): Promise<Product[]> {
    try {
      const response = await fetchWithRetry(
        `${SABY_SERVICE_URL}/api/catalog`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData: APIError = await response.json().catch(() => ({
          error: {
            code: 'SABY_SERVICE_ERROR',
            message: 'Failed to fetch catalog',
          },
        }));
        throw new Error(errorData.error.message || 'Failed to fetch catalog');
      }

      const data = await response.json();
      
      // Handle different response formats from SABY Service
      // The service might return { products: [...] } or just [...]
      const products = Array.isArray(data) ? data : data.products || [];
      
      return products;
    } catch (error) {
      console.error('Error fetching catalog:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error: Failed to fetch catalog');
    }
  }

  /**
   * Create order and submit to Backend API
   * Includes Launch Params for authentication and request ID for idempotency
   * @param orderData Order data to submit
   * @param launchParams VK Launch Params for authentication
   * @returns Promise with order response
   */
  async createOrder(
    orderData: OrderData,
    launchParams: LaunchParams
  ): Promise<OrderResponse> {
    try {
      // Generate request ID if not provided
      const requestId = orderData.request_id || generateUUID();
      
      // Prepare order data with request ID
      const orderPayload = {
        ...orderData,
        request_id: requestId,
      };

      const response = await fetchWithRetry(
        `${BACKEND_API_URL}/api/vk/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            ...launchParamsToHeaders(launchParams),
          },
          body: JSON.stringify(orderPayload),
        }
      );

      if (!response.ok) {
        const errorData: APIError = await response.json().catch(() => ({
          error: {
            code: 'ORDER_CREATION_FAILED',
            message: 'Failed to create order',
          },
        }));

        // Handle specific error codes
        if (response.status === 401) {
          throw new Error('Authentication failed. Please restart the app.');
        } else if (response.status === 429) {
          throw new Error('Too many orders. Please try again later.');
        } else if (response.status === 400) {
          throw new Error(errorData.error.message || 'Invalid order data');
        }

        throw new Error(errorData.error.message || 'Failed to create order');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error: Failed to create order');
    }
  }

  /**
   * Validate authentication with Backend API
   * Validates Launch Params signature and returns user info
   * @param launchParams VK Launch Params to validate
   * @returns Promise with auth response
   */
  async validateAuth(launchParams: LaunchParams): Promise<AuthResponse> {
    try {
      const response = await fetchWithRetry(
        `${BACKEND_API_URL}/api/vk/auth`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...launchParamsToHeaders(launchParams),
          },
        }
      );

      if (!response.ok) {
        const errorData: APIError = await response.json().catch(() => ({
          error: {
            code: 'AUTH_FAILED',
            message: 'Authentication failed',
          },
        }));

        if (response.status === 401) {
          throw new Error('Invalid authentication. Please restart the app.');
        }

        throw new Error(errorData.error.message || 'Authentication failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error validating auth:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error: Failed to validate authentication');
    }
  }

  /**
   * Generate a new request ID for order idempotency
   * @returns UUID string
   */
  generateRequestId(): string {
    return generateUUID();
  }
}

// Export singleton instance
export const apiService = new APIService();
export default apiService;
