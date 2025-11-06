const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db.js');

// 1. Инициация платежа (заглушка, пока нет API СБИС)
const processPayment = async (req, res) => {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: "orderId обязателен" });

    const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (error || !order) return res.status(404).json({ message: "Заказ не найден" });

    return res.json({
        message: "Платеж инициирован (заглушка)",
        payment_url: "https://example.com/pay",
        orderId,
    });
};

// 2. Обработка вебхука платежной системы (заглушка)
const handlePaymentWebhook = async (req, res) => {
    const { orderId, payment_status } = req.body;
    if (!orderId || !payment_status) return res.status(400).json({ message: "Некорректные данные" });

    const { error } = await supabase.from('orders').update({ payment_status }).eq('id', orderId);
    if (error) return res.status(500).json({ message: "Ошибка обновления заказа" });

    return res.json({ message: "Статус заказа обновлен" });
};
const markOrderAsPaid = async (req, res) => {
    const { orderId } = req.params;

    if (!orderId || typeof orderId !== 'string') {
        return res.status(400).json({ message: 'orderId обязателен и должен быть строкой' });
    }

    const { data, error } = await supabase
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', orderId)
        .select()
        .maybeSingle(); // 👈 безопасный аналог single()

    if (error || !data) {
        console.error('Ошибка при обновлении оплаты:', error);
        return res.status(404).json({ message: 'Заказ не найден или не обновлён', error });
    }

    return res.json({ message: 'Заказ помечен как оплаченный', order: data });
};







module.exports = { processPayment, handlePaymentWebhook, markOrderAsPaid};
