require('dotenv').config();
const { Pool } = require('pg');

// Конфигурация PostgreSQL
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'ritto_user',
    password: process.env.DB_PASSWORD || 'ritto_password',
    database: process.env.DB_NAME || 'ritto_db',
    max: 20, // Максимальное количество клиентов в пуле
    idleTimeoutMillis: 30000, // Время ожидания перед закрытием неактивного клиента
    connectionTimeoutMillis: 2000, // Время ожидания подключения
};

// Создание пула подключений
const pool = new Pool(poolConfig);

// Обработка ошибок подключения
pool.on('error', (err, client) => {
    console.error('❌ Неожиданная ошибка PostgreSQL клиента:', err);
    process.exit(-1);
});

// Проверка подключения
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Ошибка подключения к PostgreSQL:', err.stack);
        return;
    }
    console.log('✅ Успешное подключение к PostgreSQL');
    release();
});

// Утилитарная функция для выполнения запросов
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Выполнен запрос', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('❌ Ошибка выполнения запроса:', error);
        throw error;
    }
};

// Функция для получения клиента из пула (для транзакций)
const getClient = async () => {
    const client = await pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);
    
    // Установка таймаута для автоматического освобождения
    const timeout = setTimeout(() => {
        console.error('⚠️ Клиент не был освобожден в течение 5 секунд!');
    }, 5000);
    
    // Переопределение release для очистки таймаута
    client.release = () => {
        clearTimeout(timeout);
        client.release = release;
        return release();
    };
    
    return client;
};

module.exports = {
    pool,
    query,
    getClient,
};

