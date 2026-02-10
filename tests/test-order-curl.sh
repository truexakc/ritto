#!/bin/bash

# Тестовый скрипт для проверки создания заказа через curl

BACKEND_URL="http://localhost:5001"
REQUEST_ID="test-$(date +%s)-$(openssl rand -hex 4)"

echo "═══════════════════════════════════════════════════════════"
echo "  ТЕСТИРОВАНИЕ СОЗДАНИЯ ЗАКАЗА"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Request ID: $REQUEST_ID"
echo ""

# Получение товаров
echo "📦 Получение товаров из БД..."
echo ""

PRODUCTS=$(curl -s "${BACKEND_URL}/api/products" | head -c 500)
echo "Первые товары:"
echo "$PRODUCTS" | head -20
echo ""

# Получение ID первых двух товаров
PRODUCT_ID_1=$(docker exec ritto-postgres psql -U ritto_user -d ritto_db -t -c "SELECT id FROM products LIMIT 1;" | tr -d ' ')
PRODUCT_ID_2=$(docker exec ritto-postgres psql -U ritto_user -d ritto_db -t -c "SELECT id FROM products OFFSET 1 LIMIT 1;" | tr -d ' ')

echo "Используем товары:"
echo "  Product 1 ID: $PRODUCT_ID_1"
echo "  Product 2 ID: $PRODUCT_ID_2"
echo ""

# Формирование VK Launch Params
VK_USER_ID="123456789"
VK_APP_ID="51234567"
VK_TS=$(date +%s)

VK_LAUNCH_PARAMS="vk_user_id=${VK_USER_ID}&vk_app_id=${VK_APP_ID}&vk_is_app_user=1&vk_are_notifications_enabled=1&vk_language=ru&vk_platform=desktop_web&vk_ts=${VK_TS}"

echo "VK Launch Params: $VK_LAUNCH_PARAMS"
echo ""

# Формирование JSON payload
PAYLOAD=$(cat <<EOF
{
  "items": [
    {
      "id": "$PRODUCT_ID_1",
      "quantity": 1
    },
    {
      "id": "$PRODUCT_ID_2",
      "quantity": 1
    }
  ],
  "delivery_method": "pickup",
  "delivery_address": "",
  "phone": "+79194694444",
  "comment": "Тестовый заказ. Отменить.",
  "frontend_total": 0
}
EOF
)

echo "📤 Отправка заказа на бэкенд..."
echo "Payload:"
echo "$PAYLOAD"
echo ""

# Отправка запроса
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $REQUEST_ID" \
  -H "X-VK-Launch-Params: $VK_LAUNCH_PARAMS" \
  -d "$PAYLOAD" \
  "${BACKEND_URL}/api/vk/orders")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "═══════════════════════════════════════════════════════════"
echo "  ОТВЕТ ОТ БЭКЕНДА"
echo "═══════════════════════════════════════════════════════════"
echo "HTTP Status: $HTTP_STATUS"
echo ""
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_STATUS" = "201" ] || [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Заказ успешно создан!"
  echo ""
  
  # Проверка в БД
  echo "📊 Проверка заказа в БД:"
  docker exec ritto-postgres psql -U ritto_user -d ritto_db -c "SELECT id, vk_user_id, phone, delivery_method, total_price, status, created_at FROM vk_orders ORDER BY created_at DESC LIMIT 1;"
  echo ""
  
  echo "📦 Товары в заказе:"
  ORDER_ID=$(echo "$BODY" | jq -r '.order_id' 2>/dev/null)
  if [ ! -z "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
    docker exec ritto-postgres psql -U ritto_user -d ritto_db -c "SELECT product_id, product_name, quantity, price FROM vk_order_items WHERE order_id = '$ORDER_ID';"
  fi
  echo ""
  
  echo "💡 Для проверки логов выполните:"
  echo "   docker logs ritto-backend --tail 50"
  echo ""
else
  echo "❌ Ошибка при создании заказа (HTTP $HTTP_STATUS)"
  echo ""
fi

echo "═══════════════════════════════════════════════════════════"
echo "  ТЕСТИРОВАНИЕ ЗАВЕРШЕНО"
echo "═══════════════════════════════════════════════════════════"
