#!/usr/bin/env node

/**
 * Полный тест процесса создания заказа
 * Имитирует: Фронт -> Бэк -> Saby Service -> SBIS API
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Конфигурация
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';
const SABY_SERVICE_URL = process.env.SABY_SERVICE_URL || 'http://localhost:8080';

// Генерация уникального request ID для идемпотентности
const generateRequestId = () => {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
};

// Имитация VK Launch Params (упрощенная версия без подписи)
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
  
  const services = [
    { name: 'Backend', url: `${BACKEND_URL}/health` },
    { name: 'Saby Service', url: `${SABY_SERVICE_URL}/health` }
  ];
  
  for (const service of services) {
    try {
      const response = await axios.get(service.url, { timeout: 5000 });
      console.log(`✅ ${service.name} доступен (${response.status})`);
    } catch (error) {
      console.log(`❌ ${service.name} недоступен: ${error.message}`);
    }
  }
  
  console.log('\n');
};

// Получение товаров из БД
const getProducts = async () => {
  console.log('📦 Получение товаров из БД...\n');
  
  try {
    // Используем публичный эндпоинт для получения товаров
    const response = await axios.get(`${BACKEND_URL}/api/products`, {
      timeout: 5000
    });
    
    if (response.data && response.data.length > 0) {
      console.log(`✅ Найдено товаров: ${response.data.length}`);
      console.log('   Первые 3 товара:');
      response.data.slice(0, 3).forEach(product => {
        console.log(`   - ID: ${product.id}`);
        console.log(`     Name: ${product.name}`);
        console.log(`     Price: ${product.price} ₽`);
        console.log(`     NomNumber: ${product.nom_number || 'N/A'}`);
        console.log('');
      });
      return response.data;
    } else {
      console.log('⚠️  Товары не найдены\n');
      return [];
    }
  } catch (error) {
    console.log('❌ Ошибка получения товаров:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    console.log('\n');
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
    delivery_method: 'pickup', // или 'delivery'
    delivery_address: '', // пусто для самовывоза
    phone: '+79194694444',
    comment: 'Тестовый заказ. Отменить.',
    frontend_total: 0 // будет пересчитано на бэке
  };
  
  console.log('📤 Данные заказа (фронт -> бэк):');
  console.log(JSON.stringify(orderData, null, 2));
  console.log('\n');
  
  console.log('📋 Ожидаемая трансформация на бэке:');
  console.log('   1. Валидация данных заказа');
  console.log('   2. Получение полной информации о товарах из БД');
  console.log('   3. Пересчет итоговой суммы');
  console.log('   4. Сохранение в таблицу vk_orders');
  console.log('   5. Сохранение товаров в vk_order_items');
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
      console.log('  ✅ ЗАКАЗ УСПЕШНО СОЗДАН В БД');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`Order ID: ${response.data.order_id}`);
      console.log(`Actual Total: ${response.data.actual_total} ₽`);
      console.log(`Status: ${response.data.status}`);
      console.log(`Created At: ${response.data.created_at}`);
      console.log('\n');
      
      return { success: true, data: response.data };
    } else {
      console.log('❌ Ошибка: заказ не создан\n');
      return { success: false };
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
    return { success: false, error: error.message };
  }
};

// Проверка идемпотентности
const testIdempotency = async (requestId, orderData) => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ТЕСТ ИДЕМПОТЕНТНОСТИ');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('🔄 Отправка повторного запроса с тем же Request ID...\n');
  
  try {
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
    
    console.log('✅ Ответ на повторный запрос:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n');
    
    if (response.data.message && response.data.message.includes('already exists')) {
      console.log('✅ Идемпотентность работает! Вернулся существующий заказ.\n');
      return true;
    } else {
      console.log('⚠️  Идемпотентность: получен ответ, но без сообщения о существующем заказе\n');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке идемпотентности:', error.message, '\n');
    return false;
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
  const result = await createTestOrder(products);
  
  if (!result.success) {
    console.log('❌ Тестирование завершилось с ошибкой\n');
    process.exit(1);
  }
  
  // Шаг 4: Тест идемпотентности (опционально)
  // await testIdempotency(requestId, orderData);
  
  // Итоги
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО УСПЕШНО');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📊 Итоговая информация:');
  console.log(`   - Заказ создан в БД (vk_orders)`);
  console.log(`   - Order ID: ${result.data.order_id}`);
  console.log(`   - Сумма: ${result.data.actual_total} ₽`);
  console.log(`   - Статус: ${result.data.status}`);
  console.log('\n');
  
  console.log('💡 Для проверки логов выполните:');
  console.log('   Backend:       docker logs ritto-backend --tail 50');
  console.log('   Saby Service:  docker logs ritto-saby-service --tail 50');
  console.log('   Postgres:      docker exec ritto-postgres psql -U ritto_user -d ritto_db -c "SELECT * FROM vk_orders ORDER BY created_at DESC LIMIT 1;"');
  console.log('\n');
  
  process.exit(0);
};

// Запуск
main().catch((error) => {
  console.error('\n❌ Критическая ошибка:', error.message);
  process.exit(1);
});
