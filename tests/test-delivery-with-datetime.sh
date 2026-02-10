#!/bin/bash

# Тест создания заказа с доставкой и указанным временем

BACKEND_URL="http://localhost:5001"

echo "═══════════════════════════════════════════════════════════"
echo "  ТЕСТ ЗАКАЗА С ДОСТАВКОЙ И УКАЗАННЫМ ВРЕМЕНЕМ"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Получение товаров
PRODUCT_ID_1=$(docker exec ritto-postgres psql -U ritto_user -d ritto_db -t -c "SELECT id FROM products LIMIT 1;" | tr -d ' \n')

echo "📦 Товар: $PRODUCT_ID_1"
echo ""

# Формирование datetime (завтра в 18:00 по GMT+5, отправляем в UTC)
# Желаемое время: 18:00 GMT+5
# Отправляем: 13:00 UTC (18:00 - 5 часов)
# В Saby Service: 13:00 UTC + 5 часов = 18:00 GMT+5
TOMORROW=$(date -v+1d +"%Y-%m-%d")
DELIVERY_TIME="$TOMORROW 13:00:00"

echo "📅 Желаемое время доставки: 18:00 GMT+5"
echo "   Отправляем в UTC: $DELIVERY_TIME"
echo "   В Saby Service будет преобразовано: 18:00 GMT+5"
echo ""

# Payload с доставкой и datetime
PAYLOAD=$(cat <<EOF
{
  "customer_name": "Клиент с доставкой",
  "products": [
    {
      "id": "$PRODUCT_ID_1",
      "quantity": 2
    }
  ],
  "phone_number": "+79194694444",
  "delivery_method": "delivery",
  "shipping_address": "Москва, ул. Тестовая, д. 1, кв. 10",
  "payment_method": "card",
  "comment": "Доставка на завтра к 18:00",
  "datetime": "$DELIVERY_TIME",
  "total_price": 0,
  "extra_ginger_count": 1,
  "extra_wasabi_count": 1,
  "extra_soy_sauce_count": 2,
  "chopsticks_count": 2
}
EOF
)

echo "📤 Отправка заказа..."
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "${BACKEND_URL}/api/telegram/order")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"
echo "Response:"
echo "$BODY"
echo ""

if [ "$HTTP_STATUS" = "201" ]; then
  echo "✅ Заказ с доставкой создан успешно!"
  echo ""
  echo "Проверь Telegram - должно прийти:"
  echo "  🚚 Доставка: Москва, ул. Тестовая, д. 1, кв. 10"
  echo "  ⏰ Время доставки: $DELIVERY_TIME"
  echo "  🎁 Дополнительно: имбирь, васаби, соус, палочки"
  echo ""
else
  echo "❌ Ошибка создания заказа"
fi

echo "═══════════════════════════════════════════════════════════"
