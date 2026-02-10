const TelegramBot = require('node-telegram-bot-api');
const logger = require('../utils/logger');

/**
 * Telegram Notification Service for VK Mini App Orders
 * 
 * This service handles formatting and sending order notifications to Telegram Bot.
 * It implements retry mechanism and graceful error handling to ensure order creation
 * is not blocked by notification failures.
 * 
 * Requirements: 3.8.1.1, 3.8.1.2, 3.8.1.3
 */

// Telegram Bot instance (singleton)
let telegramBot = null;

/**
 * Initialize Telegram Bot
 * @returns {TelegramBot|null} Bot instance or null if not configured
 */
const initTelegramBot = () => {
    if (!telegramBot && process.env.TELEGRAM_BOT_TOKEN) {
        try {
            telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
            logger.log('✅ Telegram: Bot initialized successfully');
        } catch (error) {
            logger.error('❌ Telegram: Failed to initialize bot:', error.message);
            return null;
        }
    }
    return telegramBot;
};

/**
 * Format order data into Telegram message
 * 
 * Message format follows the design document specification:
 * - VK user info (ID)
 * - Phone number
 * - Order ID and items
 * - Total price
 * - Delivery method
 * - Delivery address (only if delivery method is "delivery")
 * - Comment (optional)
 * - Timestamp
 * 
 * @param {Object} orderData - Order data to format
 * @param {number} orderData.orderId - Order ID
 * @param {Object} orderData.vkUser - VK user information
 * @param {number} orderData.vkUser.vk_user_id - VK user ID
 * @param {string} orderData.phone - Customer phone number
 * @param {string} orderData.deliveryMethod - Delivery method ('delivery' or 'pickup')
 * @param {string} [orderData.deliveryAddress] - Delivery address (required if deliveryMethod is 'delivery')
 * @param {string} [orderData.comment] - Order comment
 * @param {Array} orderData.items - Order items
 * @param {string} orderData.items[].product_name - Product name
 * @param {number} orderData.items[].quantity - Product quantity
 * @param {number} orderData.items[].price - Product price
 * @param {number} orderData.totalPrice - Total order price
 * @param {Date} orderData.createdAt - Order creation timestamp
 * @returns {string} Formatted Telegram message
 * 
 * Requirements: 3.8.1.2
 */
const formatOrderMessage = (orderData) => {
    try {
        // Format timestamp in GMT+5 (Yekaterinburg timezone)
        const timestamp = new Date(orderData.createdAt).toLocaleString('ru-RU', {
            timeZone: 'Asia/Yekaterinburg',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // Build message according to design document format
        let message = `🆕 *Новый заказ из VK Mini App*\n\n`;
        
        // Customer information
        message += `👤 *Клиент:* VK User (ID: ${orderData.vkUser.vk_user_id})\n`;
        message += `📱 *Телефон:* ${orderData.phone}\n\n`;
        
        // Order items
        message += `📦 *Заказ #${orderData.orderId}:*\n`;
        orderData.items.forEach((item, index) => {
            message += `${index + 1}. ${item.product_name} x${item.quantity} - ${item.price}₽\n`;
        });
        
        // Total price
        message += `\n💰 *Итого: ${orderData.totalPrice}₽*\n\n`;
        
        // Delivery method
        message += `🚚 *Доставка:* ${orderData.deliveryMethod === 'delivery' ? 'Доставка' : 'Самовывоз'}\n`;
        
        // Delivery address (only if delivery method is "delivery")
        if (orderData.deliveryMethod === 'delivery' && orderData.deliveryAddress) {
            message += `📍 *Адрес:* ${orderData.deliveryAddress}\n`;
        }
        
        // Comment (optional)
        if (orderData.comment) {
            message += `\n💬 *Комментарий:* ${orderData.comment}\n`;
        }
        
        // Timestamp
        message += `\n⏰ *Время заказа:* ${timestamp}`;
        
        return message;
    } catch (error) {
        logger.error('❌ Telegram: Error formatting message:', error.message);
        throw new Error(`Failed to format order message: ${error.message}`);
    }
};

/**
 * Send notification to a single Telegram chat with retry mechanism
 * 
 * @param {TelegramBot} bot - Telegram bot instance
 * @param {string} chatId - Telegram chat ID
 * @param {string} message - Message to send
 * @param {number} retries - Number of retry attempts (default: 3)
 * @param {number} retryDelay - Delay between retries in ms (default: 1000)
 * @returns {Promise<Object>} Result object with success status
 */
const sendToChat = async (bot, chatId, message, retries = 3, retryDelay = 1000) => {
    let lastError = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            logger.log(`✅ Telegram: Message sent to chat ${chatId} (attempt ${attempt}/${retries})`);
            return { chatId, success: true, attempt };
        } catch (error) {
            lastError = error;
            logger.warn(`⚠️ Telegram: Failed to send to chat ${chatId} (attempt ${attempt}/${retries}):`, error.message);
            
            // Don't retry on certain errors (invalid chat ID, bot blocked, etc.)
            if (error.response && [400, 403].includes(error.response.statusCode)) {
                logger.error(`❌ Telegram: Permanent error for chat ${chatId}, not retrying`);
                break;
            }
            
            // Wait before retry (except on last attempt)
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }
    
    return {
        chatId,
        success: false,
        error: lastError ? lastError.message : 'Unknown error',
        attempts: retries
    };
};

/**
 * Send order notification to Telegram Bot
 * 
 * This function handles the complete notification flow:
 * 1. Initialize Telegram bot (if not already initialized)
 * 2. Validate configuration (bot token and chat IDs)
 * 3. Format order message
 * 4. Send to all configured chat IDs with retry mechanism
 * 5. Log results
 * 
 * Error handling:
 * - If bot is not configured, logs warning and returns gracefully (doesn't throw)
 * - If message formatting fails, throws error
 * - If sending fails to all chats, throws error
 * - If sending succeeds to at least one chat, returns successfully
 * 
 * @param {Object} orderData - Order data (see formatOrderMessage for structure)
 * @returns {Promise<Object>} Result object with notification status
 * @throws {Error} If message formatting fails or sending fails to all chats
 * 
 * Requirements: 3.8.1.1, 3.8.1.3
 */
const sendOrderNotification = async (orderData) => {
    try {
        // Initialize bot
        const bot = initTelegramBot();
        
        if (!bot) {
            logger.warn('⚠️ Telegram: Bot not configured (TELEGRAM_BOT_TOKEN missing), skipping notification');
            return {
                success: false,
                skipped: true,
                reason: 'Bot not configured'
            };
        }
        
        // Get chat IDs from environment
        const chatIds = process.env.TELEGRAM_CHAT_ID;
        if (!chatIds) {
            logger.warn('⚠️ Telegram: TELEGRAM_CHAT_ID not configured, skipping notification');
            return {
                success: false,
                skipped: true,
                reason: 'Chat IDs not configured'
            };
        }
        
        // Parse chat IDs (support multiple via comma)
        const chatIdList = chatIds.split(',').map(id => id.trim()).filter(id => id);
        
        if (chatIdList.length === 0) {
            logger.warn('⚠️ Telegram: No valid chat IDs found, skipping notification');
            return {
                success: false,
                skipped: true,
                reason: 'No valid chat IDs'
            };
        }
        
        // Format message
        logger.log('📝 Telegram: Formatting order message', {
            order_id: orderData.orderId
        });
        const message = formatOrderMessage(orderData);
        
        // Send to all configured chat IDs with retry mechanism
        logger.log(`📤 Telegram: Sending notification to ${chatIdList.length} chat(s)`, {
            order_id: orderData.orderId,
            chat_count: chatIdList.length
        });
        
        const sendResults = [];
        for (const chatId of chatIdList) {
            const result = await sendToChat(bot, chatId, message);
            sendResults.push(result);
        }
        
        // Count successes and failures
        const successCount = sendResults.filter(r => r.success).length;
        const failureCount = sendResults.length - successCount;
        
        // Log results
        if (successCount === 0) {
            logger.error('❌ Telegram: Failed to send notification to any chat', {
                order_id: orderData.orderId,
                total_chats: chatIdList.length,
                failed: failureCount,
                details: sendResults
            });
            throw new Error('Failed to send notification to any Telegram chat');
        }
        
        if (failureCount > 0) {
            logger.warn(`⚠️ Telegram: Notification sent to ${successCount}/${chatIdList.length} chats`, {
                order_id: orderData.orderId,
                success: successCount,
                failed: failureCount,
                details: sendResults
            });
        } else {
            logger.log(`✅ Telegram: Notification sent to all ${successCount} chat(s)`, {
                order_id: orderData.orderId
            });
        }
        
        return {
            success: true,
            total: chatIdList.length,
            sent: successCount,
            failed: failureCount,
            details: sendResults
        };
        
    } catch (error) {
        logger.error('❌ Telegram: Error sending notification:', {
            order_id: orderData.orderId,
            error: error.message
        });
        throw error;
    }
};

module.exports = {
    sendOrderNotification,
    formatOrderMessage,
    initTelegramBot
};
