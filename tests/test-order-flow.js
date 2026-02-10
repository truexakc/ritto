#!/usr/bin/env node

/**
 * Тестовый скрипт для имитации полного цикла создания заказа
 * Имитирует запрос с фронта -> бэк -> saby-service
 */

const axios = require('axios');

// Конфигурация
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const VK_USER_ID = '123456789';
const VK_APP_ID = '51234567';

// Генерация уникального request ID для идемпотентности
const generateRequestId = () => {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
};

// Имитация VK Launch Params (упрощенная версия)
const generateVkLaunchParams = () => {
  const params = {
    vk_user_id: VK_USER_ID,
    vk_app_id: VK_APP_ID,
    vk_is_app_user: '1',
    vk_are_notifications_enabled: '1',
    vk_language: 'ru',
    vk_platform: 'desktop_web',
    vk_ts: Math.floor(Date.now() / 1000).toString()
  };
  
  // В реальности здесь должна быть подпись, но для теста пропустим
  return new URLSearchParams(params).toString();
};

// Тестовые данные заказа (как с фронта)
const createTestOrder = async () => {
  console.log('🚀 Начинаем тестирование процесса создания заказа\n');
  
  const requestId = generateRequestId();
  console.log(`📋 Request ID: ${requestId}\n`);
  
  // Данные заказа (структура как с фронта VK Mini App)
  const orderData = {
    items: [
      {
        id: 1, // ID товара из БД
        quantity: 2
      },
      {
        id: 2,
        quantity: 1
      }
    ],
    delivery_method: 'pickup', // или 'delivery'
    delivery_address: '', // пусто для самовывоза
    phone: '+79194694444',
    comment: 'Тестовый заказ. Отменить.',
    frontend_total: 0 // будет пересчитано на бэке
  };
  
  console.log('📦 Данные заказа (как с фронта):');
  console.log(JSON.stringify(orderData, null, 2));
  console.log('\n');
  
  try {
    // Шаг 1: Отправка заказа на бэкенд
    console.log('📤 Шаг 1: Отправка заказа на бэкенд...');
    console.log(`   URL: ${BACKEND_URL}/api/vk/orders`);
    console.log(`   Headers: X-Request-ID: ${requestId}`);
    console.log(`   VK Launch Params: ${generateVkLaunchParams()}\n`);
    
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
    
    // Шаг 2: Проверка что заказ создан
    if (response.data.success && response.data.order_id) {
      console.log('✅ Заказ успешно создан!');
      console.log(`   Order ID: ${response.data.order_id}`);
      console.log(`   Actual Total: ${response.data.actual_total} ₽`);
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Created At: ${response.data.created_at}`);
      console.log('\n');
      
      // Шаг 3: Проверка идемпотентности (повторный запрос с тем же request_id)
      console.log('🔄 Шаг 3: Проверка идемпотентности (повторный запрос)...\n');
      
      const repeatResponse = await axios.post(
        `${BACKEND_URL}/api/vk/orders`,
        orderData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId, // тот же request ID
            'X-VK-Launch-Params': generateVkLaunchParams()
          },
          timeout: 30000
        }
      );
      
      console.log('✅ Ответ на повторный запрос:');
      console.log(JSON.stringify(repeatResponse.data, null, 2));
      console.log('\n');
      
      if (repeatResponse.data.order_id === response.data.order_id) {
        console.log('✅ Идемпотентность работает! Вернулся тот же заказ.');
      } else {
        console.log('❌ Ошибка идемпотентности! Создан новый заказ.');
      }
    } else {
      console.log('❌ Ошибка: заказ не создан');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:');
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('   Нет ответа от сервера');
      console.error(`   Error: ${error.message}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    
    process.exit(1);
  }
};

// Запуск теста
console.log('═══════════════════════════════════════════════════════════');
console.log('  ТЕСТИРОВАНИЕ ПРОЦЕССА СОЗДАНИЯ ЗАКАЗА');
console.log('═══════════════════════════════════════════════════════════\n');

createTestOrder()
  .then(() => {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО УСПЕШНО');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Тестирование завершилось с ошибкой:', error.message);
    process.exit(1);
  });
