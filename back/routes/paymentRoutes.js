const express = require('express');
const {
    processPayment,
    handlePaymentWebhook,
    markOrderAsPaid,
} = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/pay', protect, processPayment);
router.post('/webhook', handlePaymentWebhook);
router.patch('/mark-paid/:orderId', protect, admin, markOrderAsPaid); // 👈 Новый маршрут

module.exports = router;
