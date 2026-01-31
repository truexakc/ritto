const cron = require('node-cron');
const { runImport } = require('./importService');
const logger = require('../utils/logger');

let scheduledTask = null;

/**
 * Validates a cron expression
 * @param {string} expression - Cron expression to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidCronExpression(expression) {
    return cron.validate(expression);
}

/**
 * Инициализирует планировщик задач для автоматического импорта
 */
function initScheduler() {
    // Читаем cron-выражение из переменной окружения с дефолтным значением
    const cronExpression = process.env.IMPORT_SCHEDULE_CRON || '0 3 * * *';
    
    // Валидация cron-выражения
    if (!isValidCronExpression(cronExpression)) {
        logger.error(`❌ Некорректное cron-выражение: "${cronExpression}". Используется значение по умолчанию "0 3 * * *"`);
        const defaultExpression = '0 3 * * *';
        scheduledTask = cron.schedule(defaultExpression, executeScheduledImport);
    } else {
        scheduledTask = cron.schedule(cronExpression, executeScheduledImport);
    }
    
    const displayExpression = isValidCronExpression(cronExpression) ? cronExpression : '0 3 * * *';
    logger.info(`✅ Планировщик импорта инициализирован с расписанием: ${displayExpression}`);
}

/**
 * Выполняет запланированный импорт
 */
async function executeScheduledImport() {
    const timestamp = new Date().toISOString();
    logger.info(`🕐 [${timestamp}] Запуск запланированного импорта...`);
    
    try {
        const result = await runImport();
        
        if (result.success) {
            logger.info(`✅ [${timestamp}] Импорт успешно завершен`);
            logger.info(`📊 Статистика: Категории (создано: ${result.stats.categories.created}, обновлено: ${result.stats.categories.updated}), Продукты (создано: ${result.stats.products.created}, обновлено: ${result.stats.products.updated})`);
            logger.info(`⏱️  Время выполнения: ${result.duration}`);
        } else {
            logger.error(`❌ [${timestamp}] Импорт завершен с ошибкой: ${result.message}`);
        }
    } catch (error) {
        logger.error(`❌ [${timestamp}] Ошибка при выполнении запланированного импорта:`);
        logger.error(error.message);
        if (error.stack) {
            logger.error('Stack trace:', error.stack);
        }
    }
}

/**
 * Останавливает планировщик (для graceful shutdown)
 */
function stopScheduler() {
    if (scheduledTask) {
        scheduledTask.stop();
        logger.info('🛑 Планировщик импорта остановлен');
    }
}

module.exports = {
    initScheduler,
    stopScheduler
};
