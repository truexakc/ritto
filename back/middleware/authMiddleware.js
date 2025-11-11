const jwt = require('jsonwebtoken');
const { query } = require('../config/postgres');
const logger = require('../utils/logger');

// Проверка токенов для защищенных роутов
const protect = async (req, res, next) => {
    let token;

    logger.log('🔐 Auth middleware - Headers:', {
        authorization: req.headers.authorization,
        hasAuth: !!req.headers.authorization
    });

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            logger.log('🔑 Token extracted:', token ? 'exists' : 'missing');
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            logger.log('✅ Token decoded:', decoded);

            const result = await query('SELECT id, email, full_name, role FROM users WHERE id = $1', [decoded.id]);

            if (result.rows.length === 0) {
                logger.warn('❌ User not found in DB');
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            req.user = {
                id: result.rows[0].id,
                email: result.rows[0].email,
                name: result.rows[0].full_name,
                isAdmin: result.rows[0].role === 'admin'
            };

            logger.log('✅ User authenticated:', req.user.email);
            next();
        } catch (error) {
            logger.error('❌ Token verification error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        logger.warn('❌ No authorization header or invalid format');
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Опциональная авторизация (для корзины)
const optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const result = await query('SELECT id, email, full_name, role FROM users WHERE id = $1', [decoded.id]);

            if (result.rows.length > 0) {
                req.user = {
                    id: result.rows[0].id,
                    email: result.rows[0].email,
                    name: result.rows[0].full_name,
                    isAdmin: result.rows[0].role === 'admin'
                };
            }
        } catch (error) {
            logger.log('Optional auth token verification error:', error);
        }
    }

    next();
};

// Проверка прав администратора
const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as admin' });
    }
};

module.exports = { protect, admin, optionalAuth };
