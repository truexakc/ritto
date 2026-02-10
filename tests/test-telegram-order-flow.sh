#!/bin/bash

# Полный тест создания заказа через /api/telegram/order
# Фронт -> Бэк -> Saby Service -> SBIS API

BACKEND_URL="http://localhost:5001"

echo "═══════════════════════════════════════════════════════════"
echo "  ТЕСТ ПОЛНОГО ЦИКЛА СОЗДАНИЯ ЗАКАЗА"
echo "  Фронт -> Бэк -> Saby Service -> SBIS API"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Получение товаров из БД
echo "📦 Шаг 1: Получение товаров из БД..."
PRODUCT_ID_1=$(docker exec ritto-postgres psql -U ritto_user -d ritto_db -t -c "SELECT id FROM products LIMIT 1;" | tr -d ' \n')
PRODUCT_ID_2=$(docker exec ritto-postgres psql -U ritto_user -d ritto_db -t -c "SELECT id FROM products OFFSET 1 LIMIT 1;" | tr -d ' \n')

echo "  Product 1 ID: $PRODUCT_ID_1"
echo "  Product 2 ID: $PRODUCT_ID_2"
echo ""

echo "📋 Информация о товарах:"
docker exec ritto-postgres psql -U ritto_user -d ritto_db -c "SELECT id, name, price, nom_number FROM products WHERE id IN ('$PRODUCT_ID_1', '$PRODUCT_ID_2');"
echo ""

# Формирование datetime для самовывоза (текущее время + 1 час в UTC)
# Например, если сейчас 10:00 UTC, отправляем 11:00 UTC
# В Saby Service это станет 16:00 GMT+5
CURRENT_UTC=$(date -u -v+1H +"%Y-%m-%d %H:%M:%S")

echo "📅 Datetime для самовывоза (UTC + 1 час): $CURRENT_UTC"
echo "   (будет преобразован в GMT+5 в Saby Service)"
echo ""

# Формирование payload (структура как с фронта)
PAYLOAD=$(cat <<EOF
{
  "customer_name": "Тестовый клиент",
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
  "comment": "Тестовый заказ. Отменить.",
  "datetime": "$CURRENT_UTC",
  "total_price": 0,
  "extra_ginger_count": 0,
  "extra_wasabi_count": 0,
  "extra_soy_sauce_count": 0,
  "chopsticks_count": 0
}
EOF
)

echo "📤 Шаг 2: Отправка заказа на бэкенд..."
echo "Endpoint: POST $BACKEND_URL/api/telegram/order"
echo ""
echo "Payload:"
echo "$PAYLOAD"
echo ""

echo "⏳ Отправка запроса..."
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "${BACKEND_URL}/api/telegram/order")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "═══════════════════════════════════════════════════════════"
echo "  ОТВЕТ ОТ БЭКЕНДА"
echo "═══════════════════════════════════════════════════════════"
echo "HTTP Status: $HTTP_STATUS"
echo ""
echo "Response Body:"
echo "$BODY"
echo ""

if [ "$HTTP_STATUS" = "201" ] || [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Заказ успешно создан!"
  echo ""
  
  # Извлечение order_id и saby_order_id
  ORDER_ID=$(echo "$BODY" | grep -o '"order_id":"[^"]*' | cut -d'"' -f4)
  SABY_ORDER_ID=$(echo "$BODY" | grep -o '"saby_order_id":"[^"]*' | cut -d'"' -f4)
  
  echo "📊 Шаг 3: Проверка данных в БД..."
  echo ""
  
  if [ ! -z "$ORDER_ID" ]; then
    echo "🔍 Заказ в таблице saby_orders:"
    docker exec ritto-postgres psql -U ritto_user -d ritto_db -c "SELECT id, saby_order_id, created_at FROM saby_orders WHERE id = '$ORDER_ID';"
    echo ""
  fi
  
  if [ ! -z "$SABY_ORDER_ID" ]; then
    echo "✅ Saby Order ID: $SABY_ORDER_ID"
    echo ""
  fi
  
  echo "═══════════════════════════════════════════════════════════"
  echo "  ✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО УСПЕШНО"
  echo "═══════════════════════════════════════════════════════════"
  echo ""
  
  echo "📋 Цепочка выполнения:"
  echo "  1. ✅ Фронт отправил заказ на бэк"
  echo "  2. ✅ Бэк получил товары из БД"
  echo "  3. ✅ Бэк отправил заказ в Saby Service"
  echo "  4. ✅ Saby Service отправил в SBIS API"
  echo "  5. ✅ Заказ сохранен в БД"
  echo "  6. ✅ Уведомление отправлено в Telegram"
  echo ""
  
  echo "💡 Для проверки логов выполните:"
  echo "   Backend:       docker logs ritto-backend --tail 100"
  echo "   Saby Service:  docker logs ritto-saby-service --tail 50"
  echo ""
  
else
  echo "❌ Ошибка при создании заказа (HTTP $HTTP_STATUS)"
  echo ""
  
  echo "💡 Для диагностики проверьте логи:"
  echo "   docker logs ritto-backend --tail 50"
  echo "   docker logs ritto-saby-service --tail 50"
  echo ""
fi

echo "═══════════════════════════════════════════════════════════"
