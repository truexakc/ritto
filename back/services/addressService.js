const axios = require('axios');
const logger = require('../utils/logger');

const SABY_ADDRESS_API_URL = process.env.SABY_ADDRESS_API_URL || 
  'https://link.saby.ru/article/885fcb48-f55d-4ab6-a8c4-d7f62a9a73c5/fc7d089e-9e6c-4174-ad12-46bbe24237b0';
const SABY_API_KEY = process.env.SABY_API_KEY;

/**
 * Получает структурированный адрес от Saby API
 * @param {string} addressString - Адрес в текстовом формате
 * @returns {Promise<Object>} Объект с addressJSON и addressFull
 */
async function getAddressJSON(addressString) {
  try {
    logger.log('🔍 Запрос addressJSON для адреса:', addressString);
    
    const headers = {};
    
    // Добавляем API ключ если он есть
    if (SABY_API_KEY) {
      headers['Authorization'] = `Bearer ${SABY_API_KEY}`;
    }
    
    const response = await axios.get(SABY_ADDRESS_API_URL, {
      params: {
        address: addressString
      },
      timeout: 10000,
      headers: headers
    });
    
    // API возвращает массив возможных адресов
    if (!response.data || !response.data.addresses || !Array.isArray(response.data.addresses) || response.data.addresses.length === 0) {
      throw new Error('Invalid response from Saby Address API');
    }
    
    // Берем первый (наиболее подходящий) адрес из списка
    const firstAddress = response.data.addresses[0];
    const addressJSON = firstAddress.addressJSON;
    const addressFull = firstAddress.addressFull;
    
    logger.log('✅ addressJSON получен:', addressJSON);
    
    return {
      addressJSON: addressJSON, // Уже строка
      addressFull: addressFull
    };
    
  } catch (error) {
    logger.error('❌ Ошибка получения addressJSON:', error.message);
    
    // Fallback: возвращаем базовую структуру
    return {
      addressJSON: JSON.stringify({
        Address: addressString,
        Locality: 'Ярославль'
      }),
      addressFull: addressString
    };
  }
}

module.exports = { getAddressJSON };
