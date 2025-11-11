const express = require('express');
const { register, login, logout, getProfile, getMe } = require('../controllers/authController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { registerLimiter, loginLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Применяем rate limiting к регистрации и входу
router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/profile', protect, getProfile);
router.get('/me', optionalAuth, getMe);

module.exports = router;
