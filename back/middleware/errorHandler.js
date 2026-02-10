const logger = require('../utils/logger');

/**
 * Error Handler Middleware for VK Mini App Backend
 * 
 * Provides consistent error response format, maps error types to HTTP status codes,
 * logs errors with context, and returns user-friendly error messages.
 * 
 * Requirements: 3.10.1.2
 */

/**
 * Custom error class for application errors
 */
class AppError extends Error {
    constructor(code, message, statusCode = 500, details = null) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error code to HTTP status code mapping
 */
const ERROR_CODE_MAP = {
    // Authentication Errors (401)
    'AUTH_INVALID_SIGNATURE': 401,
    'AUTH_EXPIRED_PARAMS': 401,
    'AUTH_MISSING_PARAMS': 401,
    'AUTH_INTERNAL_ERROR': 500,
    
    // Validation Errors (400)
    'VALIDATION_REQUIRED_FIELD': 400,
    'VALIDATION_INVALID_FORMAT': 400,
    'VALIDATION_INVALID_VALUE': 400,
    
    // Integration Errors
    'SABY_SERVICE_UNAVAILABLE': 503,
    'TELEGRAM_SEND_FAILED': 500,
    'DATABASE_ERROR': 500,
    
    // Business Logic Errors
    'CART_EMPTY': 400,
    'PRODUCT_NOT_FOUND': 404,
    'PRODUCT_UNAVAILABLE': 400,
    'ORDER_CREATION_FAILED': 500,
    'PRICE_MISMATCH': 400,
    'DUPLICATE_ORDER': 409,
    'RATE_LIMIT_EXCEEDED': 429
};

/**
 * Map error type to HTTP status code
 * @param {string} errorCode - Error code
 * @returns {number} HTTP status code
 */
const getStatusCodeFromErrorCode = (errorCode) => {
    return ERROR_CODE_MAP[errorCode] || 500;
};

/**
 * Map database error to application error
 * @param {Error} error - Database error
 * @returns {AppError} Application error
 */
const mapDatabaseError = (error) => {
    // PostgreSQL error codes
    if (error.code === '23505') {
        // Unique constraint violation
        return new AppError(
            'DUPLICATE_ORDER',
            'A record with this identifier already exists',
            409
        );
    }
    
    if (error.code === '23503') {
        // Foreign key constraint violation
        return new AppError(
            'DATABASE_ERROR',
            'Referenced record does not exist',
            400
        );
    }
    
    if (error.code === '23502') {
        // Not null constraint violation
        return new AppError(
            'VALIDATION_REQUIRED_FIELD',
            'Required field is missing',
            400
        );
    }
    
    if (error.code === '23514') {
        // Check constraint violation
        return new AppError(
            'VALIDATION_INVALID_VALUE',
            'Invalid value for field',
            400
        );
    }
    
    // Connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return new AppError(
            'DATABASE_ERROR',
            'Database connection failed',
            503
        );
    }
    
    // Generic database error
    return new AppError(
        'DATABASE_ERROR',
        'Database operation failed',
        500,
        process.env.NODE_ENV === 'development' ? error.message : null
    );
};

/**
 * Map SABY Service error to application error
 * @param {Error} error - SABY Service error
 * @returns {AppError} Application error
 */
const mapSabyServiceError = (error) => {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return new AppError(
            'SABY_SERVICE_UNAVAILABLE',
            'Product catalog is temporarily unavailable. Please try again later.',
            503
        );
    }
    
    if (error.response && error.response.status === 404) {
        return new AppError(
            'PRODUCT_NOT_FOUND',
            'Product not found in catalog',
            404
        );
    }
    
    return new AppError(
        'SABY_SERVICE_UNAVAILABLE',
        'Failed to fetch product catalog',
        503
    );
};

/**
 * Map Telegram Bot error to application error
 * @param {Error} error - Telegram Bot error
 * @returns {AppError} Application error
 */
const mapTelegramError = (error) => {
    return new AppError(
        'TELEGRAM_SEND_FAILED',
        'Failed to send notification',
        500,
        process.env.NODE_ENV === 'development' ? error.message : null
    );
};

/**
 * Format error response
 * @param {Error} error - Error object
 * @param {boolean} includeStack - Include stack trace
 * @returns {Object} Formatted error response
 */
const formatErrorResponse = (error, includeStack = false) => {
    const response = {
        error: {
            code: error.code || 'INTERNAL_ERROR',
            message: error.message || 'An unexpected error occurred'
        }
    };
    
    if (error.details) {
        response.error.details = error.details;
    }
    
    if (includeStack && error.stack) {
        response.error.stack = error.stack;
    }
    
    return response;
};

/**
 * Log error with context
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 */
const logError = (error, req) => {
    const context = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        user_agent: req.get('user-agent'),
        vk_user_id: req.vkUser ? req.vkUser.vk_user_id : null,
        error_code: error.code,
        error_message: error.message,
        status_code: error.statusCode
    };
    
    if (error.statusCode >= 500) {
        logger.error('❌ Server Error:', context);
        if (error.stack) {
            logger.error('Stack trace:', error.stack);
        }
    } else if (error.statusCode >= 400) {
        logger.warn('⚠️ Client Error:', context);
    } else {
        logger.log('ℹ️ Error:', context);
    }
};

/**
 * Error handling middleware
 * Catches all errors and returns consistent error response
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
    let error = err;
    
    // Convert non-AppError errors to AppError
    if (!(error instanceof AppError)) {
        // Check if it's a database error
        if (error.code && error.code.startsWith('23')) {
            error = mapDatabaseError(error);
        }
        // Check if it's a SABY Service error
        else if (error.message && error.message.includes('SABY')) {
            error = mapSabyServiceError(error);
        }
        // Check if it's a Telegram error
        else if (error.message && error.message.includes('Telegram')) {
            error = mapTelegramError(error);
        }
        // Generic error
        else {
            error = new AppError(
                'INTERNAL_ERROR',
                error.message || 'An unexpected error occurred',
                error.statusCode || 500
            );
        }
    }
    
    // Log error with context
    logError(error, req);
    
    // Get status code
    const statusCode = error.statusCode || getStatusCodeFromErrorCode(error.code) || 500;
    
    // Format error response
    const includeStack = process.env.NODE_ENV === 'development';
    const errorResponse = formatErrorResponse(error, includeStack);
    
    // Send error response
    res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 * 
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped route handler
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Not found handler
 * Returns 404 error for unknown routes
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFound = (req, res, next) => {
    const error = new AppError(
        'NOT_FOUND',
        `Route not found - ${req.originalUrl}`,
        404
    );
    next(error);
};

module.exports = {
    AppError,
    errorHandler,
    asyncHandler,
    notFound,
    mapDatabaseError,
    mapSabyServiceError,
    mapTelegramError,
    formatErrorResponse,
    logError,
    getStatusCodeFromErrorCode
};
