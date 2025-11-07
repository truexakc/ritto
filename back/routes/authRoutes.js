const express = require('express');
const { register, login, logout, getProfile, getMe } = require('../controllers/authController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', protect, getProfile);
router.get('/me', optionalAuth, getMe); // Опциональная авторизация для /me

module.exports = router;
