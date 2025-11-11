/**
 * Утилита для условного логирования
 * Логи выводятся только в режиме разработки или если явно включен DEBUG режим
 */

const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const isDebugMode = process.env.DEBUG === 'true';

const shouldLog = isDevelopment || isDebugMode;

const logger = {
    log: (...args) => {
        if (shouldLog) {
            console.log(...args);
        }
    },
    
    info: (...args) => {
        if (shouldLog) {
            console.info(...args);
        }
    },
    
    warn: (...args) => {
        if (shouldLog) {
            console.warn(...args);
        }
    },
    
    error: (...args) => {
        // Ошибки всегда логируем
        console.error(...args);
    },
    
    debug: (...args) => {
        if (isDebugMode) {
            console.debug(...args);
        }
    }
};

module.exports = logger;
