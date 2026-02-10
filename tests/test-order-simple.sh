#!/bin/bash

# Простой тест создания заказа через /api/orders

BACKEND_URL="http://localhost:5001"

echo "═══════════════════════════════════════════════════════════"
echo "  ТЕСТ СОЗДАНИЯ ЗАКАЗА"
echo "  Фронт -> Бэк -> Saby Service -> SBIS"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Получение ID товаров из БД
echo "📦 Получение товаров из БД..."
PRODUCT_ID_1=$(docker exec ritto-postgres psql -U ritto_user -d ritto_db -t -c "SELECT id FROM products LIMIT 1;" | tr -d ' \n')
PRODUCT_ID_2=$(docker exec ritto-postgres psql -U ritto_user -d ritto_db -t -c "SELECT id FROM products OFFSET 1 LIMIT 1;" | tr -d ' \n')

echo "  Product 1 ID: $PRODUCT_ID_1"
echo "  Product 2 ID: $PRODUCT_ID_2"
echo ""

# Получение информации о товарах
echo "📋 Информация о товарах:"
docker exec ritto-postgres psql -U ritto_user -d ritto_db -c "SELECT id, name, price, nom_number FROM products WHERE id IN ('$PRODUCT_ID_1', '$PRODUCT_ID_2');"
echo ""

# Формирование payload согласно структуре из orderController
PAYLOAD=$(cat <<EOF
{
  "products": [
    {
      "id": "$PRODUCT_ID_1",
      "quantity": 1
    },
    {
      "id": "$PRODUCT_ID_2",
      "quantity": 1
    }
  ],
  "phone_number": "+79194694444",
  "delivery_method": "pickup",
  "shipping_address": "",
  "payment_method": "cash",
  "comment": "Тестовый заказ. Отменить."
}
EOF
)

echo "📤 Отправка заказа на бэкенд..."
echo "Endpoint: POST $BACKEND_URL/api/orders"
echo ""
echo "Payload:"
echo "$PAYLOAD" | jq '.'
echo ""

# Отправка запроса (требуется авторизация - используем protect middleware)
# Для теста нужен JWT токен, поэтому сначала создадим тестового пользователя или используем существующего

echo "⚠️  Внимание: Эндпоинт /api/orders требует авторизации (protect middleware)"
echo "Для полного теста нужен JWT токен."
echo ""
echo "Попытка отправки без токена (ожидается 401):"

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "${BACKEND_URL}/api/orders")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_STATUS" = "401" ]; then
  echo "✅ Ожидаемый результат: требуется авторизация"
  echo ""
  echo "💡 Для полного теста нужно:"
  echo "   1. Создать тестового пользователя или использовать существующего"
  echo "   2. Получить JWT токен через /api/auth/login"
  echo "   3. Отправить запрос с заголовком: Authorization: Bearer <token>"
  echo ""
  echo "Или использовать эндпоинт без авторизации (если есть)"
fi

echo "═══════════════════════════════════════════════════════════"
echo "  ТЕСТ ЗАВЕРШЕН"
echo "═══════════════════════════════════════════════════════════"
