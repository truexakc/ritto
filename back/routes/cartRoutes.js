const express = require('express');
const { getCart, addToCart, removeFromCart, clearCart, mergeSessionCartToDb } = require('../controllers/cartController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Роуты доступны как для авторизованных, так и для неавторизованных пользователей
router.get('/', optionalAuth, getCart);
router.post('/add', optionalAuth, addToCart);
router.post('/remove', optionalAuth, removeFromCart);
router.post('/clear', optionalAuth, clearCart);

// Роут для переноса корзины из сессии в БД (только для авторизованных)
router.post('/merge', protect, mergeSessionCartToDb);

module.exports = router;
