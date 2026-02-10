const TelegramBot = require('node-telegram-bot-api');
const logger = require('../utils/logger');
const { sendOrderToSaby } = require('../services/sabyIntegration');
const { query } = require('../config/postgres');

// Инициализация бота
let bot = null;

const initBot = () => {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        logger.warn('⚠️ TELEGRAM_BOT_TOKEN не установлен в .env');
        return null;
    }
    
    if (!bot) {
        bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
    }
    return bot;
};

// Форматирование сообщения о заказе
const formatOrderMessage = (orderData) => {
    // GMT+5 (Екатеринбург, Челябинск, Уфа и т.д.)
    const timestamp = new Date().toLocaleString('ru-RU', { 
        timeZone: 'Asia/Yekaterinburg',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    let message = `🛒 *НОВЫЙ ЗАКАЗ*\n\n`;
    
    message += `👤 *Клиент:*\n`;
    if (orderData.customer_name) {
        message += `👨 Имя: ${orderData.customer_name}\n`;
    }
    message += `📞 Телефон: ${orderData.phone_number}\n`;
    
    if (orderData.delivery_method === 'delivery') {
        message += `🚚 Доставка: ${orderData.shipping_address}\n`;
        if (orderData.datetime) {
            // Преобразуем UTC в GMT+5 для отображения
            const utcDate = new Date(orderData.datetime + ' UTC');
            const gmt5Date = new Date(utcDate.getTime() + 5 * 60 * 60 * 1000);
            const formattedDate = gmt5Date.toLocaleString('ru-RU', { 
                timeZone: 'UTC',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            message += `⏰ Время доставки: ${formattedDate} (GMT+5)\n`;
        }
    } else {
        message += `🏪 Самовывоз\n`;
        if (orderData.datetime) {
            // Преобразуем UTC в GMT+5 для отображения
            const utcDate = new Date(orderData.datetime + ' UTC');
            const gmt5Date = new Date(utcDate.getTime() + 5 * 60 * 60 * 1000);
            const formattedDate = gmt5Date.toLocaleString('ru-RU', { 
                timeZone: 'UTC',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            message += `⏰ Время самовывоза: ${formattedDate} (GMT+5)\n`;
        }
    }
    
    message += `\n📦 *Товары:*\n`;
    
    // Вычисляем итоговую сумму на основе товаров
    let totalPrice = 0;
    orderData.products.forEach((item, index) => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = parseInt(item.quantity) || 0;
        const itemTotal = itemPrice * itemQuantity;
        totalPrice += itemTotal;
        
        message += `${index + 1}. ${item.name || 'Товар'} x${item.quantity} (${itemPrice}₽ × ${itemQuantity} = ${itemTotal}₽)\n`;
    });
    
    // Дополнительные позиции
    const extras = [];
    if (orderData.extra_ginger_count) extras.push(`🥢 Имбирь: ${orderData.extra_ginger_count} шт.`);
    if (orderData.extra_wasabi_count) extras.push(`🟢 Васаби: ${orderData.extra_wasabi_count} шт.`);
    if (orderData.extra_soy_sauce_count) extras.push(`🍶 Соевый соус: ${orderData.extra_soy_sauce_count} шт.`);
    if (orderData.chopsticks_count) extras.push(`🥢 Палочки: ${orderData.chopsticks_count} пар`);
    
    if (extras.length > 0) {
        message += `\n🎁 *Дополнительно:*\n`;
        extras.forEach(extra => message += `${extra}\n`);
    }
    
    message += `\n💰 *Итого: ${totalPrice.toFixed(2)}₽*\n`;
    message += `💳 Оплата: ${orderData.payment_method === 'card' ? 'Картой' : 'Наличными'}\n`;
    
    if (orderData.comment) {
        message += `\n💬 *Комментарий:* ${orderData.comment}\n`;
    }
    
    if (orderData.saby_order_id) {
        message += `\n🔖 ID заказа: ${orderData.saby_order_id}\n`;
    }
    
    message += `\n📅 Создан: ${timestamp}`;
    
    return message;
};

// Отправка заказа в Telegram И в Saby
const sendOrderNotification = async (req, res) => {
    try {
        const orderData = req.body;
        
        // Валидация
        if (!orderData.products || !Array.isArray(orderData.products) || orderData.products.length === 0) {
            return res.status(400).json({ message: "Список товаров пуст" });
        }

        if (!orderData.delivery_method) {
            return res.status(400).json({ message: "Укажите способ получения" });
        }
        
        if (!orderData.phone_number) {
            return res.status(400).json({ message: "Укажите номер телефона" });
        }

        // ========================================
        // Обработка datetime
        // ========================================
        // Datetime должен приходить с фронта в UTC для обоих случаев (доставка и самовывоз)
        if (!orderData.datetime) {
            return res.status(400).json({ 
                success: false,
                message: "Необходимо указать время (datetime в UTC)" 
            });
        }
        
        const datetime = orderData.datetime;
        logger.log(`📅 Datetime из запроса (UTC, будет преобразован в GMT+5 в Saby Service): ${datetime}`);

        // ========================================
        // ШАГ 1: Получаем полную информацию о товарах из БД
        // ========================================
        logger.log('📦 Получение информации о товарах из БД...');
        
        const productIds = orderData.products.map(p => p.id);
        const { rows: dbProducts } = await query(
            'SELECT id, name, price, nom_number FROM products WHERE id = ANY($1)',
            [productIds]
        );

        if (!dbProducts || dbProducts.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: "Ошибка загрузки товаров из БД" 
            });
        }

        // Обогащаем товары данными из БД
        const enrichedProducts = orderData.products.map(item => {
            const product = dbProducts.find(p => p.id === item.id);
            if (!product) {
                throw new Error(`Товар с ID ${item.id} не найден`);
            }
            return {
                id: item.id,
                name: product.name,
                quantity: item.quantity,
                price: product.price,
                nomNumber: product.nom_number
            };
        });

        logger.log('✅ Товары обогащены данными из БД:', enrichedProducts);

        // ========================================
        // ШАГ 2: Отправка заказа в Saby Service
        // ========================================
        logger.log('📤 Отправка заказа в Saby Service...');
        
        const sabyOrderData = {
            phone: orderData.phone_number,
            delivery_method: orderData.delivery_method,
            delivery_address: orderData.shipping_address || '',
            payment_method: orderData.payment_method || 'cash',
            comment: orderData.comment || '',
            datetime: datetime, // Передаем обработанный datetime
            items: enrichedProducts.map(item => ({
                product_id: item.id,
                nomNumber: item.nomNumber,
                quantity: item.quantity,
                price: item.price
            }))
        };

        const vkUser = {
            vk_user_id: orderData.customer_name || 'web-customer'
        };

        const sabyResult = await sendOrderToSaby(sabyOrderData, vkUser);

        if (!sabyResult.success) {
            logger.error('❌ Ошибка отправки в Saby:', sabyResult.error);
            return res.status(503).json({
                success: false,
                message: 'Ошибка отправки заказа в систему',
                error: sabyResult.error
            });
        }

        const sabyOrderId = sabyResult.data.orderId || sabyResult.data.order_id;
        
        if (!sabyOrderId) {
            logger.error('❌ Не удалось извлечь order_id из ответа Saby');
            return res.status(500).json({
                success: false,
                message: 'Ошибка обработки ответа от системы'
            });
        }

        logger.log('✅ Заказ успешно отправлен в Saby, Order ID:', sabyOrderId);

        // ========================================
        // ШАГ 3: Сохранение в БД
        // ========================================
        const { rows } = await query(
            'INSERT INTO saby_orders (saby_order_id) VALUES ($1) RETURNING id, saby_order_id, created_at',
            [sabyOrderId]
        );

        if (!rows || rows.length === 0) {
            logger.error('❌ Ошибка сохранения заказа в БД');
        } else {
            logger.log('✅ Заказ сохранен в БД:', rows[0]);
        }

        // ========================================
        // ШАГ 4: Отправка уведомления в Telegram
        // ========================================
        const telegramBot = initBot();
        
        if (telegramBot && process.env.TELEGRAM_CHAT_ID) {
            const chatIdList = process.env.TELEGRAM_CHAT_ID.split(',').map(id => id.trim()).filter(id => id);
            
            // Обновляем orderData с обогащенными товарами для форматирования сообщения
            const orderDataForTelegram = {
                ...orderData,
                products: enrichedProducts,
                saby_order_id: sabyOrderId,
                datetime: datetime // Добавляем datetime для отображения в Telegram
            };
            
            const message = formatOrderMessage(orderDataForTelegram);
            
            for (const chatId of chatIdList) {
                try {
                    await telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
                    logger.log(`✅ Уведомление отправлено в Telegram (Chat ID: ${chatId})`);
                } catch (telegramError) {
                    logger.error(`❌ Ошибка отправки в Telegram (Chat ID: ${chatId}):`, telegramError.message);
                }
            }
        }

        // ========================================
        // Успешный ответ
        // ========================================
        res.status(201).json({ 
            success: true,
            message: "Заказ успешно создан",
            order_id: rows[0]?.id,
            saby_order_id: sabyOrderId,
            datetime: datetime,
            created_at: rows[0]?.created_at
        });
        
    } catch (error) {
        logger.error("❌ Ошибка при создании заказа:", error.message || error);
        res.status(500).json({ 
            success: false,
            message: "Ошибка сервера", 
            error: error.message 
        });
    }
};

// Тестовая отправка сообщения
const sendTestMessage = async (req, res) => {
    try {
        const telegramBot = initBot();
        
        if (!telegramBot) {
            return res.status(500).json({ 
                message: 'Telegram бот не настроен',
                success: false 
            });
        }
        
        const chatIds = process.env.TELEGRAM_CHAT_ID;
        
        if (!chatIds) {
            return res.status(500).json({ 
                message: 'TELEGRAM_CHAT_ID не установлен в .env',
                success: false 
            });
        }
        
        // Парсим Chat IDs (поддержка нескольких через запятую)
        const chatIdList = chatIds.split(',').map(id => id.trim()).filter(id => id);
        
        const sendResults = [];
        for (const chatId of chatIdList) {
            try {
                await telegramBot.sendMessage(chatId, '✅ Тестовое сообщение от Ritto Bot!');
                logger.log(`✅ Тестовое сообщение отправлено в Chat ID: ${chatId}`);
                sendResults.push({ chatId, success: true });
            } catch (error) {
                logger.error(`❌ Ошибка отправки в Chat ID ${chatId}:`, error.message);
                sendResults.push({ chatId, success: false, error: error.message });
            }
        }
        
        const successCount = sendResults.filter(r => r.success).length;
        
        res.status(200).json({ 
            message: `Тестовое сообщение отправлено (${successCount}/${chatIdList.length})`,
            success: successCount > 0,
            results: {
                total: chatIdList.length,
                success: successCount,
                failed: chatIdList.length - successCount,
                details: sendResults
            }
        });
        
    } catch (error) {
        logger.error('❌ Ошибка отправки тестового сообщения:', error);
        res.status(500).json({ 
            message: 'Ошибка отправки сообщения',
            error: error.message,
            success: false 
        });
    }
};

module.exports = {
    sendOrderNotification,
    sendTestMessage
};
