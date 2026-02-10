const db = require('../config/postgres');
const logger = require('../utils/logger');
const { AppError } = require('./errorHandler');

/**
 * VK Mini App Rate Limiting Middleware
 * 
 * Implements per-user rate limiting to prevent spam and DDOS attacks.
 * Tracks order count in a sliding time window (1 hour).
 * Maximum 10 orders per hour per user.
 * 
 * Requirements: Security requirement
 */

// Configuration
const RATE_LIMIT_WINDOW_HOURS = 1;
const RATE_LIMIT_MAX_ORDERS = 10;
const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000;

/**
 * Checks and updates rate limit for a VK user
 * @param {number} vkUserId - VK user ID
 * @returns {Object} - { allowed: boolean, retryAfter: number|null }
 */
const checkRateLimit = async (vkUserId) => {
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');

        const now = new Date();
        const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

        // Get or create rate limit record
        const selectQuery = `
            SELECT order_count, window_start, last_order_at
            FROM vk_rate_limits
            WHERE vk_user_id = $1
            FOR UPDATE
        `;
        const selectResult = await client.query(selectQuery, [vkUserId]);

        let orderCount = 0;
        let currentWindowStart = now;
        let lastOrderAt = null;

        if (selectResult.rows.length > 0) {
            const record = selectResult.rows[0];
            const recordWindowStart = new Date(record.window_start);
            lastOrderAt = record.last_order_at ? new Date(record.last_order_at) : null;

            // Check if we're still in the same window
            if (recordWindowStart > windowStart) {
                // Still in the same window
                orderCount = record.order_count;
                currentWindowStart = recordWindowStart;
            } else {
                // Window has expired, reset counter
                orderCount = 0;
                currentWindowStart = now;
            }
        }

        // Check if rate limit is exceeded
        if (orderCount >= RATE_LIMIT_MAX_ORDERS) {
            await client.query('COMMIT');
            
            // Calculate retry-after in seconds
            const windowEnd = new Date(currentWindowStart.getTime() + RATE_LIMIT_WINDOW_MS);
            const retryAfter = Math.ceil((windowEnd.getTime() - now.getTime()) / 1000);

            logger.warn('⚠️ Rate Limit: User exceeded limit', {
                vk_user_id: vkUserId,
                order_count: orderCount,
                max_orders: RATE_LIMIT_MAX_ORDERS,
                retry_after: retryAfter
            });

            return {
                allowed: false,
                retryAfter: retryAfter > 0 ? retryAfter : 1
            };
        }

        // Increment counter
        const newOrderCount = orderCount + 1;

        // Update or insert rate limit record
        const upsertQuery = `
            INSERT INTO vk_rate_limits (vk_user_id, order_count, window_start, last_order_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (vk_user_id)
            DO UPDATE SET
                order_count = $2,
                window_start = $3,
                last_order_at = $4
        `;
        await client.query(upsertQuery, [vkUserId, newOrderCount, currentWindowStart, now]);

        await client.query('COMMIT');

        logger.log('✅ Rate Limit: Check passed', {
            vk_user_id: vkUserId,
            order_count: newOrderCount,
            max_orders: RATE_LIMIT_MAX_ORDERS,
            remaining: RATE_LIMIT_MAX_ORDERS - newOrderCount
        });

        return {
            allowed: true,
            retryAfter: null
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('❌ Rate Limit: Database error:', error.message);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Rate Limiting Middleware
 * Checks if user has exceeded rate limit before allowing order creation
 * Requires vkAuthMiddleware to be applied first (to populate req.vkUser)
 */
const rateLimitMiddleware = async (req, res, next) => {
    try {
        // Check if user is authenticated (vkAuthMiddleware should run first)
        if (!req.vkUser || !req.vkUser.vk_user_id) {
            logger.error('❌ Rate Limit: User not authenticated');
            throw new AppError(
                'AUTH_REQUIRED',
                'Authentication required for rate limiting',
                401
            );
        }

        const vkUserId = req.vkUser.vk_user_id;

        logger.log('🔍 Rate Limit: Checking limit for user', { vk_user_id: vkUserId });

        // Check rate limit
        const { allowed, retryAfter } = await checkRateLimit(vkUserId);

        if (!allowed) {
            logger.warn('🚫 Rate Limit: Request blocked', {
                vk_user_id: vkUserId,
                retry_after: retryAfter
            });

            // Set Retry-After header
            res.set('Retry-After', retryAfter.toString());
            
            throw new AppError(
                'RATE_LIMIT_EXCEEDED',
                `Too many orders. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
                429,
                {
                    retry_after: retryAfter,
                    max_orders: RATE_LIMIT_MAX_ORDERS,
                    window_hours: RATE_LIMIT_WINDOW_HOURS
                }
            );
        }

        // Rate limit check passed, continue to next middleware
        next();
    } catch (error) {
        // If it's already an AppError, pass it through
        if (error instanceof AppError) {
            return next(error);
        }
        
        logger.error('❌ Rate Limit: Unexpected error:', error.message);
        
        // On error, fail open (allow request) to prevent blocking legitimate users
        // but log the error for monitoring
        logger.warn('⚠️ Rate Limit: Failing open due to error');
        next();
    }
};

/**
 * Placeholder rate limiters for auth routes
 * These are simple pass-through middleware for now
 * Can be enhanced with express-rate-limit if needed
 */
const registerLimiter = (req, res, next) => {
    // TODO: Implement proper rate limiting for registration
    next();
};

const loginLimiter = (req, res, next) => {
    // TODO: Implement proper rate limiting for login
    next();
};

module.exports = {
    rateLimitMiddleware,
    checkRateLimit,
    registerLimiter,
    loginLimiter,
    RATE_LIMIT_WINDOW_HOURS,
    RATE_LIMIT_MAX_ORDERS
};
