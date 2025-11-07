#!/bin/bash

# Тест добавления товара в корзину без авторизации

echo "Тестируем добавление товара в корзину..."

# Получаем ID первого продукта
PRODUCT_ID=$(docker exec ritto-postgres psql -U ritto_user -d ritto_db -t -c "SELECT id FROM products LIMIT 1;")
PRODUCT_ID=$(echo $PRODUCT_ID | xargs)

echo "ID продукта: $PRODUCT_ID"

# Пробуем добавить в корзину
curl -X POST http://localhost/api/cart/add \
  -H "Content-Type: application/json" \
  -d "{\"product_id\": \"$PRODUCT_ID\", \"quantity\": 1}" \
  -c cookies.txt \
  -b cookies.txt \
  -v

echo ""
echo "Проверяем сессии в БД:"
docker exec ritto-postgres psql -U ritto_user -d ritto_db -c "SELECT sid, expire FROM session ORDER BY expire DESC LIMIT 3;"
