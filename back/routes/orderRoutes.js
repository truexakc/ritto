const express = require('express');
const router = express.Router();
const { createOrder } = require('../controllers/orderController');

// POST /api/telegram/order - создание заказа через Telegram/фронтенд
router.post('/telegram/order', createOrder);

module.exports = router;
