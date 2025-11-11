const rateLimit = require('express-rate-limit');

// Rate limiter для регистрации - ограничение по IP
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 3, // максимум 3 попытки регистрации с одного IP
    message: {
        message: 'Слишком много попыток регистрации с этого IP. Попробуйте позже через 15 минут.'
    },
    standardHeaders: true, // Возвращает информацию о лимите в заголовках `RateLimit-*`
    legacyHeaders: false, // Отключает заголовки `X-RateLimit-*`
    // Используем IP адрес как ключ
    keyGenerator: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        console.log(`🔍 Rate limit check - IP: ${ip}`);
        return ip;
    },
    // Пропускаем успешные запросы (не считаем их в лимит)
    skipSuccessfulRequests: false,
    // Пропускаем неудачные запросы
    skipFailedRequests: false,
    handler: (req, res) => {
        console.log(`⚠️  Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            message: 'Слишком много попыток регистрации с этого IP. Попробуйте позже через 15 минут.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    }
});

// Rate limiter для входа - более мягкий лимит
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 10, // максимум 10 попыток входа с одного IP
    message: {
        message: 'Слишком много попыток входа. Попробуйте позже через 15 минут.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
    },
    skipSuccessfulRequests: true, // Не считаем успешные входы
    handler: (req, res) => {
        console.log(`⚠️  Login rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            message: 'Слишком много попыток входа. Попробуйте позже через 15 минут.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    }
});

// Rate limiter для сброса пароля
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 3, // максимум 3 запроса на сброс пароля в час
    message: {
        message: 'Слишком много запросов на сброс пароля. Попробуйте позже через час.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
    },
    handler: (req, res) => {
        console.log(`⚠️  Password reset rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            message: 'Слишком много запросов на сброс пароля. Попробуйте позже через час.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    }
});

// Общий rate limiter для API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум 100 запросов с одного IP
    message: {
        message: 'Слишком много запросов с этого IP. Попробуйте позже.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
    }
});

module.exports = {
    registerLimiter,
    loginLimiter,
    passwordResetLimiter,
    apiLimiter
};
