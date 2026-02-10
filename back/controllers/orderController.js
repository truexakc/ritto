const { query } = require('../config/postgres');
const logger = require('../utils/logger');
const { sendOrderToSaby } = require('../services/sabyIntegration');
const { validateOrderData } = require('../services/orderValidation');

// 🔹 Создание заказа
const createOrder = async (req, res) => {
    try {
        // Подготовка данных заказа для валидации
        const orderData = {
            phone: req.body.phone_number,
            delivery_method: req.body.delivery_method,
            delivery_address: req.body.shipping_address,
            items: req.body.products || [],
            payment_method: req.body.payment_method,
            comment: req.body.comment
        };

        // Получаем информацию о пользователе VK
        const vkUser = {
            vk_user_id: req.user?.vk_user_id || req.body.vk_user_id || 'guest'
        };

        // Получаем реальные данные товаров из базы (включая nomNumber)
        if (orderData.items.length > 0) {
            const productIds = orderData.items.map(p => p.id);
            const { rows: dbProducts } = await query(
                'SELECT id, name, price, external_id, hierarchical_id, nom_number FROM products WHERE id = ANY($1)',
                [productIds]
            );

            if (!dbProducts || dbProducts.length === 0) {
                return res.status(400).json({ 
                    success: false,
                    message: "Ошибка загрузки товаров" 
                });
            }

            // Обогащаем items данными из БД (включая nomNumber)
            orderData.items = orderData.items.map(item => {
                const product = dbProducts.find(p => p.id === item.id);
                if (!product) {
                    throw new Error(`Товар с ID ${item.id} не найден`);
                }
                return {
                    product_id: item.id,
                    nomNumber: product.nom_number,
                    quantity: item.quantity,
                    price: product.price
                };
            });
        }

        // Валидация данных заказа (Requirements 7.1-7.7)
        const validation = validateOrderData(orderData);
        if (!validation.valid) {
            logger.warn('❌ Валидация заказа не пройдена:', validation.errors);
            return res.status(400).json({
                success: false,
                message: 'Ошибка валидации заказа',
                errors: validation.errors
            });
        }

        // Отправка заказа в Saby Service (Requirements 8.1, 8.2)
        const sabyResult = await sendOrderToSaby(orderData, vkUser);

        if (!sabyResult.success) {
            // Обработка ошибок от Saby Service (Requirements 8.3, 8.4)
            logger.error('❌ Ошибка отправки в Saby:', {
                error: sabyResult.error,
                details: sabyResult.details
            });

            // Определяем тип ошибки и возвращаем соответствующий статус
            if (sabyResult.error?.includes('unavailable') || sabyResult.error?.includes('ECONNREFUSED') || sabyResult.error?.includes('timeout')) {
                return res.status(503).json({
                    success: false,
                    message: 'Сервис временно недоступен. Пожалуйста, попробуйте позже.',
                    error: 'Service unavailable'
                });
            }

            // Внутренняя ошибка сервера
            return res.status(500).json({
                success: false,
                message: 'Ошибка при создании заказа',
                error: sabyResult.error
            });
        }

        // Извлечение saby_order_id из ответа (Requirement 8.1)
        const sabyOrderId = sabyResult.data.orderId || sabyResult.data.order_id;
        
        if (!sabyOrderId) {
            logger.error('❌ Не удалось извлечь order_id из ответа Saby:', sabyResult.data);
            return res.status(500).json({
                success: false,
                message: 'Ошибка обработки ответа от Saby',
                error: 'Missing order_id in response'
            });
        }

        // Сохранение только saby_order_id в таблицу saby_orders (Requirements 1.2, 8.2)
        const { rows } = await query(
            'INSERT INTO saby_orders (saby_order_id) VALUES ($1) RETURNING id, saby_order_id, created_at',
            [sabyOrderId]
        );

        if (!rows || rows.length === 0) {
            logger.error('❌ Ошибка сохранения заказа в БД');
            return res.status(500).json({
                success: false,
                message: 'Ошибка сохранения заказа',
                error: 'Database insert failed'
            });
        }

        const savedOrder = rows[0];

        logger.log('✅ Заказ успешно создан:', {
            order_id: savedOrder.id,
            saby_order_id: savedOrder.saby_order_id,
            created_at: savedOrder.created_at
        });

        // Возврат успешного ответа (Requirement 3.5)
        res.status(201).json({
            success: true,
            message: 'Заказ успешно создан',
            order_id: savedOrder.id,
            saby_order_id: savedOrder.saby_order_id,
            created_at: savedOrder.created_at
        });

    } catch (error) {
        // Обработка внутренних ошибок (Requirement 8.4)
        logger.error('❌ Внутренняя ошибка при создании заказа:', {
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера',
            error: error.message
        });
    }
};


// Заглушки для других функций (пока не реализованы)
const getUserOrders = async (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
};

const updateOrderStatus = async (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
};

const getOrderDetails = async (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
};

const getAllOrders = async (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
};

const deleteOrder = async (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
};

module.exports = {
    createOrder,
    getUserOrders,
    updateOrderStatus,
    getOrderDetails,
    getAllOrders,
    deleteOrder
};
