const crypto = require('crypto');
const logger = require('../utils/logger');
const { AppError } = require('./errorHandler');

/**
 * VK Mini App Authentication Middleware
 * 
 * Validates VK Launch Params signature and extracts user information.
 * Launch Params are passed in the request headers as individual parameters.
 * 
 * Requirements: 3.2.1.2, 3.2.1.3, 3.7.1.4, 3.7.1.5, 3.10.1.4
 */

/**
 * Validates VK Launch Params signature using HMAC-SHA256
 * @param {Object} params - Launch Params object
 * @param {string} secret - VK App Secret
 * @returns {boolean} - True if signature is valid
 */
const validateSignature = (params, secret) => {
    try {
        // Extract sign from params
        const sign = params.sign;
        if (!sign) {
            logger.warn('❌ VK Auth: Missing sign parameter');
            return false;
        }

        // Create a copy of params without the sign
        const paramsWithoutSign = { ...params };
        delete paramsWithoutSign.sign;

        // Sort parameters alphabetically and create query string
        const sortedKeys = Object.keys(paramsWithoutSign).sort();
        const queryString = sortedKeys
            .map(key => `${key}=${paramsWithoutSign[key]}`)
            .join('&');

        // Calculate HMAC-SHA256
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(queryString);
        const calculatedSign = hmac.digest('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        // Use constant-time comparison to prevent timing attacks
        const isValid = crypto.timingSafeEqual(
            Buffer.from(sign),
            Buffer.from(calculatedSign)
        );

        if (!isValid) {
            logger.warn('❌ VK Auth: Invalid signature', {
                expected: calculatedSign,
                received: sign
            });
        }

        return isValid;
    } catch (error) {
        logger.error('❌ VK Auth: Signature validation error:', error.message);
        return false;
    }
};

/**
 * Checks if Launch Params timestamp is not expired (24 hour window)
 * @param {number} timestamp - Unix timestamp from vk_ts parameter
 * @returns {boolean} - True if timestamp is valid
 */
const isTimestampValid = (timestamp) => {
    try {
        const now = Math.floor(Date.now() / 1000);
        const age = now - timestamp;
        const maxAge = 24 * 60 * 60; // 24 hours in seconds

        if (age > maxAge) {
            logger.warn('❌ VK Auth: Timestamp expired', {
                timestamp,
                age,
                maxAge
            });
            return false;
        }

        if (age < 0) {
            logger.warn('❌ VK Auth: Timestamp in the future', {
                timestamp,
                now
            });
            return false;
        }

        return true;
    } catch (error) {
        logger.error('❌ VK Auth: Timestamp validation error:', error.message);
        return false;
    }
};

/**
 * Extracts Launch Params from request headers
 * VK Launch Params are passed as individual headers with 'x-vk-' prefix
 * @param {Object} req - Express request object
 * @returns {Object|null} - Launch Params object or null if missing
 */
const extractLaunchParams = (req) => {
    try {
        const params = {};

        // Extract VK parameters from headers
        // Headers are lowercase in Express
        Object.keys(req.headers).forEach(header => {
            if (header.startsWith('x-vk-')) {
                // Replace x-vk- prefix and convert all remaining dashes to underscores
                const paramName = header.replace('x-vk-', 'vk_').replace(/-/g, '_');
                params[paramName] = req.headers[header];
            } else if (header === 'x-sign') {
                // Handle sign parameter separately (doesn't have vk_ prefix)
                params['sign'] = req.headers[header];
            }
        });

        // Also check query parameters as fallback
        if (Object.keys(params).length === 0 && req.query) {
            Object.keys(req.query).forEach(key => {
                if (key.startsWith('vk_') || key === 'sign') {
                    params[key] = req.query[key];
                }
            });
        }

        // Check for required parameters
        const requiredParams = ['vk_user_id', 'vk_app_id', 'vk_ts', 'sign'];
        const missingParams = requiredParams.filter(param => !params[param]);

        if (missingParams.length > 0) {
            logger.warn('❌ VK Auth: Missing required parameters:', missingParams);
            return null;
        }

        return params;
    } catch (error) {
        logger.error('❌ VK Auth: Error extracting Launch Params:', error.message);
        return null;
    }
};

/**
 * Extracts user information from Launch Params
 * @param {Object} params - Launch Params object
 * @returns {Object} - User information object
 */
const extractUserInfo = (params) => {
    return {
        vk_user_id: parseInt(params.vk_user_id, 10),
        vk_app_id: parseInt(params.vk_app_id, 10),
        vk_is_app_user: parseInt(params.vk_is_app_user || '0', 10),
        vk_are_notifications_enabled: parseInt(params.vk_are_notifications_enabled || '0', 10),
        vk_language: params.vk_language || 'ru',
        vk_platform: params.vk_platform || 'unknown',
        vk_ts: parseInt(params.vk_ts, 10)
    };
};

/**
 * VK Authentication Middleware
 * Validates Launch Params and attaches user info to request
 */
const vkAuthMiddleware = async (req, res, next) => {
    try {
        logger.log('🔐 VK Auth: Validating Launch Params');

        // Check if VK_APP_SECRET is configured
        const vkAppSecret = process.env.VK_APP_SECRET;
        if (!vkAppSecret) {
            logger.error('❌ VK Auth: VK_APP_SECRET not configured');
            throw new AppError(
                'AUTH_CONFIG_ERROR',
                'VK authentication is not configured',
                500
            );
        }

        // Extract Launch Params
        const launchParams = extractLaunchParams(req);
        if (!launchParams) {
            logger.warn('❌ VK Auth: Failed to extract Launch Params');
            throw new AppError(
                'AUTH_MISSING_PARAMS',
                'Required VK Launch Params are missing',
                401
            );
        }

        // Validate timestamp
        const timestamp = parseInt(launchParams.vk_ts, 10);
        if (!isTimestampValid(timestamp)) {
            logger.warn('❌ VK Auth: Timestamp validation failed');
            throw new AppError(
                'AUTH_EXPIRED_PARAMS',
                'VK Launch Params have expired',
                401
            );
        }

        // Validate signature
        if (!validateSignature(launchParams, vkAppSecret)) {
            logger.warn('❌ VK Auth: Signature validation failed');
            throw new AppError(
                'AUTH_INVALID_SIGNATURE',
                'VK Launch Params signature is invalid',
                401
            );
        }

        // Extract and attach user info to request
        const userInfo = extractUserInfo(launchParams);
        req.vkUser = userInfo;
        req.launchParams = launchParams;

        logger.log('✅ VK Auth: User authenticated', {
            vk_user_id: userInfo.vk_user_id,
            vk_platform: userInfo.vk_platform
        });

        next();
    } catch (error) {
        // Pass error to error handler middleware
        next(error);
    }
};

module.exports = {
    vkAuthMiddleware,
    validateSignature,
    isTimestampValid,
    extractLaunchParams,
    extractUserInfo
};
