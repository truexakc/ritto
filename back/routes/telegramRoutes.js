const express = require('express');
const { sendOrderNotification, sendTestMessage } = require('../controllers/telegramController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Создание заказа с отправкой в Telegram
router.post('/order', protect, sendOrderNotification);

// Тестовая отправка сообщения (только для админа)
router.post('/test', protect, admin, sendTestMessage);

module.exports = router;
