#!/usr/bin/env node

const crypto = require('crypto');

// VK App Secret из .env
const VK_APP_SECRET = 'ca3dcdb0ca3dcdb0ca3dcdb099c9030e53cca3dca3dcdb0a3ba40e0437e1eeeb8678ce9';

// VK Launch Params
const params = {
  vk_user_id: '123456789',
  vk_app_id: '51234567',
  vk_is_app_user: '1',
  vk_are_notifications_enabled: '1',
  vk_language: 'ru',
  vk_platform: 'desktop_web',
  vk_ts: Math.floor(Date.now() / 1000).toString()
};

// Сортируем параметры и создаем query string
const sortedKeys = Object.keys(params).sort();
const queryString = sortedKeys
  .map(key => `${key}=${params[key]}`)
  .join('&');

console.log('Query String:', queryString);
console.log('');

// Вычисляем HMAC-SHA256
const hmac = crypto.createHmac('sha256', VK_APP_SECRET);
hmac.update(queryString);
const sign = hmac.digest('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');

console.log('Generated Signature:', sign);
console.log('');

// Выводим заголовки для curl
console.log('Заголовки для curl:');
console.log(`-H "X-VK-User-Id: ${params.vk_user_id}"`);
console.log(`-H "X-VK-App-Id: ${params.vk_app_id}"`);
console.log(`-H "X-VK-Is-App-User: ${params.vk_is_app_user}"`);
console.log(`-H "X-VK-Are-Notifications-Enabled: ${params.vk_are_notifications_enabled}"`);
console.log(`-H "X-VK-Language: ${params.vk_language}"`);
console.log(`-H "X-VK-Platform: ${params.vk_platform}"`);
console.log(`-H "X-VK-Ts: ${params.vk_ts}"`);
console.log(`-H "X-Sign: ${sign}"`);
console.log('');

// Выводим полный curl команду
const BACKEND_URL = 'http://localhost:5001';
const REQUEST_ID = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

console.log('Полная curl команда:');
console.log('');
console.log(`curl -X POST \\`);
console.log(`  "${BACKEND_URL}/api/vk/orders" \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "X-Request-ID: ${REQUEST_ID}" \\`);
console.log(`  -H "X-VK-User-Id: ${params.vk_user_id}" \\`);
console.log(`  -H "X-VK-App-Id: ${params.vk_app_id}" \\`);
console.log(`  -H "X-VK-Is-App-User: ${params.vk_is_app_user}" \\`);
console.log(`  -H "X-VK-Are-Notifications-Enabled: ${params.vk_are_notifications_enabled}" \\`);
console.log(`  -H "X-VK-Language: ${params.vk_language}" \\`);
console.log(`  -H "X-VK-Platform: ${params.vk_platform}" \\`);
console.log(`  -H "X-VK-Ts: ${params.vk_ts}" \\`);
console.log(`  -H "X-Sign: ${sign}" \\`);
console.log(`  -d '{`);
console.log(`    "items": [`);
console.log(`      {"id": "PRODUCT_ID_1", "quantity": 1},`);
console.log(`      {"id": "PRODUCT_ID_2", "quantity": 1}`);
console.log(`    ],`);
console.log(`    "delivery_method": "pickup",`);
console.log(`    "delivery_address": "",`);
console.log(`    "phone": "+79194694444",`);
console.log(`    "comment": "Тестовый заказ. Отменить.",`);
console.log(`    "frontend_total": 0`);
console.log(`  }'`);
console.log('');
