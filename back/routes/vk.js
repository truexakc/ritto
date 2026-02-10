const express = require('express');
const { vkAuthMiddleware } = require('../middleware/vkAuthMiddleware');
const { rateLimitMiddleware } = require('../middleware/rateLimitMiddleware');
const { validateOrderAndRecomputePrice } = require('../services/orderValidation');
const { sendOrderNotification } = require('../services/telegramNotification');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const db = require('../config/postgres');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * VK Mini App Routes
 * 
 * POST /api/vk/orders - Create new order from VK Mini App
 * GET /api/vk/auth - Validate VK Launch Params and return user info
 * 
 * Requirements: 3.7.1.1, 3.7.1.3
 */

/**
 * POST /api/vk/orders
 * Create new order from VK Mini App
 * 
 * Middleware: vkAuthMiddleware, rateLimitMiddleware
 * Requirements: 3.2.1.4, 3.6.1.7, 3.7.1.2
 */
router.post('/orders', vkAuthMiddleware, rateLimitMiddleware, asyncHandler(async (req, res) => {
    const client = await db.getClient();
    
    try {
        logger.log('📦 VK Order: Creating new order');
        
        // Extract client request ID from headers (X-Request-ID)
        const requestId = req.headers['x-request-id'];
        if (!requestId) {
            logger.warn('❌ VK Order: Missing X-Request-ID header');
            throw new AppError(
                'VALIDATION_REQUIRED_FIELD',
                'X-Request-ID header is required for idempotency',
                400
            );
        }
        
        // Check for existing order with same request ID (idempotency)
        logger.log('🔍 VK Order: Checking for existing order with request_id:', requestId);
        const existingOrderQuery = `
            SELECT id, vk_user_id, total_price, status, created_at
            FROM vk_orders
            WHERE request_id = $1
        `;
        const existingOrderResult = await client.query(existingOrderQuery, [requestId]);
        
        if (existingOrderResult.rows.length > 0) {
            const existingOrder = existingOrderResult.rows[0];
            logger.log('✅ VK Order: Found existing order (idempotent request)', {
                order_id: existingOrder.id,
                request_id: requestId
            });
            
            return res.status(200).json({
                success: true,
                order_id: existingOrder.id,
                actual_total: parseFloat(existingOrder.total_price),
                status: existingOrder.status,
                message: 'Order already exists (idempotent request)',
                created_at: existingOrder.created_at
            });
        }
        
        // Extract order data from request body
        const { items, delivery_method, delivery_address, phone, comment, frontend_total } = req.body;
        
        // Validate order data structure
        if (!items || !Array.isArray(items) || items.length === 0) {
            logger.warn('❌ VK Order: Invalid items array');
            throw new AppError(
                'CART_EMPTY',
                'Order must contain at least one item',
                400
            );
        }
        
        if (!delivery_method || !['delivery', 'pickup'].includes(delivery_method)) {
            logger.warn('❌ VK Order: Invalid delivery method');
            throw new AppError(
                'VALIDATION_INVALID_VALUE',
                'Delivery method must be either "delivery" or "pickup"',
                400
            );
        }
        
        if (!phone) {
            logger.warn('❌ VK Order: Missing phone number');
            throw new AppError(
                'VALIDATION_REQUIRED_FIELD',
                'Phone number is required',
                400
            );
        }
        
        if (delivery_method === 'delivery' && !delivery_address) {
            logger.warn('❌ VK Order: Missing delivery address for delivery method');
            throw new AppError(
                'VALIDATION_REQUIRED_FIELD',
                'Delivery address is required when delivery method is "delivery"',
                400
            );
        }
        
        // Call order validation service to validate products and recompute price
        logger.log('🔍 VK Order: Validating products and recomputing price');
        const validationResult = await validateOrderAndRecomputePrice(items, frontend_total || 0);
        
        if (!validationResult.valid) {
            logger.warn('❌ VK Order: Validation failed', {
                errors: validationResult.errors
            });
            throw new AppError(
                'VALIDATION_INVALID_VALUE',
                'Order validation failed',
                400,
                validationResult.errors
            );
        }
        
        // Log price mismatch if detected
        if (validationResult.priceMismatch) {
            logger.warn('⚠️ VK Order: Price mismatch detected', {
                frontend_total: validationResult.frontendTotal,
                actual_total: validationResult.actualTotal,
                difference: validationResult.actualTotal - validationResult.frontendTotal
            });
        }
        
        // Get user info from vkAuthMiddleware
        const vkUser = req.vkUser;
        const vkUserName = `${vkUser.vk_user_id}`; // Use VK user ID as name for now
        
        // Start database transaction
        await client.query('BEGIN');
        
        // Store order in vk_orders table with recomputed price
        logger.log('💾 VK Order: Storing order in database');
        const insertOrderQuery = `
            INSERT INTO vk_orders (
                request_id,
                vk_user_id,
                vk_user_name,
                phone,
                delivery_method,
                delivery_address,
                comment,
                total_price,
                frontend_total_price,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, created_at
        `;
        const insertOrderValues = [
            requestId,
            vkUser.vk_user_id,
            vkUserName,
            phone,
            delivery_method,
            delivery_address || null,
            comment || null,
            validationResult.actualTotal,
            validationResult.frontendTotal,
            'pending'
        ];
        const orderResult = await client.query(insertOrderQuery, insertOrderValues);
        const orderId = orderResult.rows[0].id;
        const createdAt = orderResult.rows[0].created_at;
        
        logger.log('✅ VK Order: Order created', { order_id: orderId });
        
        // Store order items in vk_order_items table
        logger.log('💾 VK Order: Storing order items');
        const insertItemQuery = `
            INSERT INTO vk_order_items (
                order_id,
                product_id,
                product_name,
                quantity,
                price
            ) VALUES ($1, $2, $3, $4, $5)
        `;
        
        for (const item of validationResult.validatedItems) {
            await client.query(insertItemQuery, [
                orderId,
                item.product_id,
                item.product_name,
                item.quantity,
                item.price
            ]);
        }
        
        logger.log('✅ VK Order: Order items stored', {
            order_id: orderId,
            item_count: validationResult.validatedItems.length
        });
        
        // Commit transaction
        await client.query('COMMIT');
        
        // Send notification to Telegram Bot (async, don't block response)
        // Errors in notification should not fail the order creation
        setImmediate(async () => {
            try {
                await sendOrderNotification({
                    orderId,
                    vkUser,
                    phone,
                    deliveryMethod: delivery_method,
                    deliveryAddress: delivery_address,
                    comment,
                    items: validationResult.validatedItems,
                    totalPrice: validationResult.actualTotal,
                    createdAt
                });
            } catch (notificationError) {
                logger.error('❌ VK Order: Failed to send Telegram notification', {
                    order_id: orderId,
                    error: notificationError.message
                });
                // Don't fail the order creation due to notification error
            }
        });
        
        // Return order ID and actual total price
        logger.log('✅ VK Order: Order created successfully', {
            order_id: orderId,
            actual_total: validationResult.actualTotal
        });
        
        return res.status(201).json({
            success: true,
            order_id: orderId,
            actual_total: validationResult.actualTotal,
            status: 'pending',
            message: 'Order created successfully',
            created_at: createdAt
        });
        
    } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        
        // Re-throw error to be handled by error handler middleware
        throw error;
    } finally {
        client.release();
    }
}));

/**
 * GET /api/vk/auth
 * Validate VK Launch Params and return user info
 * 
 * Middleware: vkAuthMiddleware
 * Requirements: 3.2.1.5, 3.7.1.4
 */
router.get('/auth', vkAuthMiddleware, asyncHandler(async (req, res) => {
    logger.log('🔐 VK Auth: Returning user info');
    
    // Extract user info from Launch Params (already validated by middleware)
    const userInfo = req.vkUser;
    
    if (!userInfo) {
        logger.error('❌ VK Auth: User info not found in request');
        throw new AppError(
            'AUTH_INTERNAL_ERROR',
            'User information not available',
            500
        );
    }
    
    // Return user info
    logger.log('✅ VK Auth: User info returned', {
        vk_user_id: userInfo.vk_user_id
    });
    
    return res.status(200).json({
        success: true,
        user: {
            vk_user_id: userInfo.vk_user_id,
            vk_app_id: userInfo.vk_app_id,
            vk_is_app_user: userInfo.vk_is_app_user,
            vk_are_notifications_enabled: userInfo.vk_are_notifications_enabled,
            vk_language: userInfo.vk_language,
            vk_platform: userInfo.vk_platform,
            vk_ts: userInfo.vk_ts
        }
    });
}));

module.exports = router;
