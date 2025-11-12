const TelegramBot = require('node-telegram-bot-api');
const logger = require('../utils/logger');

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
    } else {
        message += `🏪 Самовывоз\n`;
    }
    
    message += `\n📦 *Товары:*\n`;
    orderData.products.forEach((item, index) => {
        message += `${index + 1}. ${item.name || 'Товар'} x${item.quantity}\n`;
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
    
    message += `\n💰 *Итого: ${orderData.total_price}₽*\n`;
    message += `💳 Оплата: ${orderData.payment_method === 'card' ? 'Картой' : 'Наличными'}\n`;
    
    if (orderData.comment) {
        message += `\n💬 *Комментарий:* ${orderData.comment}\n`;
    }
    
    message += `\n⏰ Время заказа: ${timestamp}`;
    
    return message;
};

// Отправка заказа в Telegram (БЕЗ сохранения в БД)
const sendOrderNotification = async (req, res) => {
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
        
        // Формируем сообщение
        const message = formatOrderMessage(orderData);
        
        // Отправляем сообщение всем указанным Chat ID
        const sendResults = [];
        for (const chatId of chatIdList) {
            try {
                await telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
                logger.log(`✅ Уведомление о заказе отправлено в Telegram (Chat ID: ${chatId})`);
                sendResults.push({ chatId, success: true });
            } catch (telegramError) {
                logger.error(`❌ Ошибка отправки в Telegram (Chat ID: ${chatId}):`, telegramError.message);
                sendResults.push({ chatId, success: false, error: telegramError.message });
            }
        }
        
        const successCount = sendResults.filter(r => r.success).length;
        
        if (successCount === 0) {
            return res.status(500).json({
                message: "Не удалось отправить уведомление в Telegram",
                success: false,
                telegramResults: {
                    total: chatIdList.length,
                    success: 0,
                    failed: chatIdList.length,
                    details: sendResults
                }
            });
        }
        
        res.status(200).json({ 
            message: "Заказ успешно отправлен в Telegram", 
            success: true,
            telegramSent: true,
            telegramResults: {
                total: chatIdList.length,
                success: successCount,
                failed: chatIdList.length - successCount,
                details: sendResults
            }
        });
        
    } catch (error) {
        logger.error("❌ Ошибка при отправке заказа:", error.message || error);
        res.status(500).json({ 
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
