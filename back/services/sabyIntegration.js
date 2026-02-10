const axios = require('axios');
const logger = require('../utils/logger');
const { getAddressJSON } = require('./addressService');

const SABY_SERVICE_URL = process.env.SABY_SERVICE_URL || 'http://saby-service:8080';
const SBIS_POINT_ID = parseInt(process.env.SBIS_POINT_ID || '1');
const SBIS_PRICE_LIST_ID = parseInt(process.env.SBIS_PRICE_LIST_ID || '1');

/**
 * Отправляет заказ в Saby-service для дальнейшей передачи в SBIS API
 * @param {Object} orderData - Данные заказа из VK Mini App
 * @param {Object} vkUser - Информация о пользователе VK
 * @returns {Promise<Object>} Результат отправки с saby_order_id
 */
async function sendOrderToSaby(orderData, vkUser) {
  try {
    logger.log('📤 Отправка заказа в Saby-service:', {
      userId: vkUser.vk_user_id,
      deliveryMethod: orderData.delivery_method,
      itemsCount: orderData.items?.length,
      datetime: orderData.datetime
    });

    // Определяем тип доставки
    const isPickup = orderData.delivery_method === 'pickup';

    // Формируем addressJSON и addressFull в зависимости от типа доставки
    let addressJSON = '';
    let addressFull = '';

    if (isPickup) {
      // Для самовывоза: addressJSON с isPickup=true, addressFull пустой
      addressJSON = JSON.stringify({
        isPickup: true
      });
      addressFull = '';
    } else {
      // Для доставки: вызываем getAddressJSON() для получения структурированного адреса
      const addressData = await getAddressJSON(orderData.delivery_address);
      addressJSON = addressData.addressJSON;
      addressFull = addressData.addressFull;
      
      // Убеждаемся, что addressJSON - это строка
      if (typeof addressJSON !== 'string') {
        logger.warn('⚠️  addressJSON не является строкой, конвертируем:', typeof addressJSON);
        addressJSON = JSON.stringify(addressJSON);
      }
      
      // Убеждаемся, что addressFull - это строка
      if (typeof addressFull !== 'string') {
        logger.warn('⚠️  addressFull не является строкой, конвертируем:', typeof addressFull);
        addressFull = String(addressFull);
      }
      
      // Логируем полученные данные адреса
      logger.log('📍 Данные адреса для отправки в Saby:', {
        addressJSON: addressJSON,
        addressFull: addressFull,
        addressJSONType: typeof addressJSON,
        addressFullType: typeof addressFull
      });
    }

    // Используем datetime из orderData (уже обработанный в контроллере)
    const datetime = orderData.datetime || formatDateTimeForSBIS(new Date());

    // Валидация данных адреса для доставки
    if (!isPickup) {
      if (!addressJSON || typeof addressJSON !== 'string') {
        throw new Error('addressJSON должен быть непустой строкой для доставки');
      }
      if (!addressFull || typeof addressFull !== 'string') {
        throw new Error('addressFull должен быть непустой строкой для доставки');
      }
    }

    // Формируем payload согласно схеме Saby API
    const payload = {
      product: 'delivery',
      pointId: SBIS_POINT_ID,
      comment: orderData.comment || '',
      customer: {
        name: vkUser.vk_user_id.toString(),
        phone: orderData.phone
      },
      datetime: datetime,
      promocode: '',
      promocodeV2: '',
      nomenclatures: orderData.items.map(item => ({
        nomNumber: item.nomNumber,
        count: item.quantity,
        priceListId: SBIS_PRICE_LIST_ID
      })),
      delivery: {
        isPickup: isPickup,
        addressJSON: addressJSON,
        addressFull: addressFull,
        paymentType: mapPaymentMethod(orderData.payment_method || 'card')
      }
    };

    // Логирование полного payload перед отправкой
    logger.log('📋 Полный payload для Saby:', JSON.stringify(payload, null, 2));
    
    // Дополнительное логирование delivery для отладки
    logger.log('🚚 Delivery данные:', {
      isPickup: payload.delivery.isPickup,
      addressJSON: payload.delivery.addressJSON,
      addressFull: payload.delivery.addressFull,
      paymentType: payload.delivery.paymentType
    });

    // Отправляем запрос в saby-service
    const response = await axios.post(
      `${SABY_SERVICE_URL}/api/v1/orders`,
      payload,
      {
        timeout: 30000, // 30 секунд
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    logger.log('✅ Заказ успешно отправлен в Saby:', {
      sabyOrderId: response.data.orderId,
      status: response.data.status
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    logger.error('❌ Ошибка отправки заказа в Saby:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
}

/**
 * Маппинг способа оплаты из формата back-service в формат SBIS
 * @param {string} method - Способ оплаты из back-service
 * @returns {string} Способ оплаты для SBIS API
 */
function mapPaymentMethod(method) {
  const mapping = {
    'card': 'card',
    'cash': 'cash',
    'online': 'card'
  };

  const mapped = mapping[method?.toLowerCase()];
  
  if (!mapped) {
    logger.warn(`⚠️  Неизвестный способ оплаты: ${method}, используем 'card' по умолчанию`);
    return 'card';
  }

  return mapped;
}

/**
 * Форматирует дату в формат SBIS API: "гггг-мм-дд чч:мм:сс"
 * Добавляет 1 день к текущему времени чтобы избежать ошибки "время в прошлом"
 * @param {Date} date - Объект даты
 * @returns {string} Отформатированная строка даты
 */
function formatDateTimeForSBIS(date) {
  // Добавляем 1 день к текущему времени
  const futureDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  
  const year = futureDate.getFullYear();
  const month = String(futureDate.getMonth() + 1).padStart(2, '0');
  const day = String(futureDate.getDate()).padStart(2, '0');
  const hours = String(futureDate.getHours()).padStart(2, '0');
  const minutes = String(futureDate.getMinutes()).padStart(2, '0');
  const seconds = String(futureDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Проверяет доступность Saby-service
 * @returns {Promise<boolean>} true если сервис доступен
 */
async function checkSabyServiceHealth() {
  try {
    const response = await axios.get(`${SABY_SERVICE_URL}/health`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    logger.error('❌ Saby-service недоступен:', error.message);
    return false;
  }
}

module.exports = {
  sendOrderToSaby,
  mapPaymentMethod,
  formatDateTimeForSBIS,
  checkSabyServiceHealth
};
