#!/usr/bin/env node

/**
 * Тестовый скрипт для отслеживания полной цепочки заказа до Saby
 * Фронт -> Бэк -> Saby Service -> SBIS API
 */

const axios = require('axios');

// Конфигурация
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const SABY_SERVICE_URL = process.env.SABY_SERVICE_URL || 'http://localhost:8080';

// Генерация уникального request ID
const generateRequestId = () => {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
};

// Имитация VK Launch Params
const generateVkLaunchParams = () => {
  const params = {
    vk_user_id: '123456789',
    vk_app_id: '51234567',
    vk_is_app_user: '1',
    vk_are_notifications_enabled: '1',
    vk_language: 'ru',
    vk_platform: 'desktop_web',
    vk_ts: Math.floor(Date.now() / 1000).toString()
  };
  
  return new URLSearchParams(params).toString();
};

// Проверка доступности сервисов
const checkServices = async () => {
  console.log('🔍 Проверка доступности сервисов...\n');
  
  // Проверка бэкенда
  try {
    await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    console.log('✅ Backend доступен');
  } catch (error) {
    console.log('❌ Backend недоступен:', error.message);
  }
  
  // Проверка Saby Service
  try {
    await axios.get(`${SABY_SERVICE_URL}/health`, { timeout: 5000 });
    console.log('✅ Saby Service доступен');
  } catch (error) {
    console.log('❌ Saby Service недоступен:', error.message);
  }
  
  console.log('\n');
};

// Получение товаров из БД для формирования заказа
const getProducts = async () => {
  console.log('📦 Получение товаров из БД...\n');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/products`, {
      timeout: 5000
    });
    
    if (response.data && response.data.length > 0) {
      console.log(`✅ Найдено товаров: ${response.data.length}`);
      console.log('   Первые 3 товара:');
      response.data.slice(0, 3).forEach(product => {
        console.log(`   - ID: ${product.id}, Name: ${product.name}, Price: ${product.price}, NomNumber: ${product.nom_number || 'N/A'}`);
      });
      console.log('\n');
      return response.data;
    } else {
      console.log('⚠️  Товары не найдены\n');
      return [];
    }
  } catch (error) {
    console.log('❌ Ошибка получения товаров:', error.message, '\n');
    return [];
  }
};

// Создание тестового заказа
const createTestOrder = async (products) => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  СОЗДАНИЕ ТЕСТОВОГО ЗАКАЗА');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const requestId = generateRequestId();
  console.log(`📋 Request ID: ${requestId}\n`);
  
  // Формируем заказ с реальными товарами
  const orderData = {
    items: products.slice(0, 2).map(product => ({
      id: product.id,
      quantity: 1
    })),
    delivery_method: 'pickup',
    delivery_address: '',
    phone: '+79194694444',
    comment: 'Тестовый заказ. Отменить.',
    frontend_total: 0
  };
  
  console.log('📤 Данные заказа (фронт -> бэк):');
  console.log(JSON.stringify(orderData, null, 2));
  console.log('\n');
  
  try {
    console.log('⏳ Отправка заказа на бэкенд...\n');
    
    const response = await axios.post(
      `${BACKEND_URL}/api/vk/orders`,
      orderData,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'X-VK-Launch-Params': generateVkLaunchParams()
        },
        timeout: 30000
      }
    );
    
    console.log('✅ Ответ от бэкенда:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n');
    
    if (response.data.success && response.data.order_id) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  ✅ ЗАКАЗ УСПЕШНО СОЗДАН');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`Order ID: ${response.data.order_id}`);
      console.log(`Actual Total: ${response.data.actual_total} ₽`);
      console.log(`Status: ${response.data.status}`);
      console.log(`Created At: ${response.data.created_at}`);
      console.log('\n');
      
      return response.data;
    } else {
      console.log('❌ Ошибка: заказ не создан\n');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Ошибка при создании заказа:\n');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Нет ответа от сервера');
      console.error(`Error: ${error.message}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    
    console.log('\n');
    return null;
  }
};

// Основная функция
const main = async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ТЕСТИРОВАНИЕ ПОЛНОЙ ЦЕПОЧКИ ЗАКАЗА');
  console.log('  Фронт -> Бэк -> Saby Service -> SBIS API');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Шаг 1: Проверка сервисов
  await checkServices();
  
  // Шаг 2: Получение товаров
  const products = await getProducts();
  
  if (products.length === 0) {
    console.log('❌ Невозможно создать заказ без товаров');
    process.exit(1);
  }
  
  // Шаг 3: Создание заказа
  const order = await createTestOrder(products);
  
  if (order) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО УСПЕШНО');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📊 Итоговая информация:');
    console.log(`   - Заказ создан в БД (vk_orders)`);
    console.log(`   - Order ID: ${order.order_id}`);
    console.log(`   - Сумма: ${order.actual_total} ₽`);
    console.log(`   - Статус: ${order.status}`);
    console.log('\n');
    
    console.log('💡 Для проверки логов бэкенда выполните:');
    console.log('   docker logs ritto-backend --tail 50\n');
    
    console.log('💡 Для проверки логов Saby Service выполните:');
    console.log('   docker logs ritto-saby-service --tail 50\n');
    
    process.exit(0);
  } else {
    console.log('❌ Тестирование завершилось с ошибкой\n');
    process.exit(1);
  }
};

// Запуск
main().catch((error) => {
  console.error('\n❌ Критическая ошибка:', error.message);
  process.exit(1);
});
