const express = require('express');
const { sendOrderNotification, sendTestMessage } = require('../controllers/telegramController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Создание заказа с отправкой в Telegram (доступно без авторизации)
router.post('/order', sendOrderNotification);

// Тестовая отправка сообщения (только для админа)
router.post('/test', protect, admin, sendTestMessage);

module.exports = router;
