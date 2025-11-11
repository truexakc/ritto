const jwt = require('jsonwebtoken');
const logger = require('./logger');

const generateToken = (id) => {
    logger.log("🎫 Генерация токена для ID:", id);

    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

module.exports = generateToken;

