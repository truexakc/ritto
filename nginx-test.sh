#!/bin/bash
# Скрипт для тестирования nginx конфигурации

echo "=== Тест 1: Проверка конфигурации nginx ==="
docker-compose exec nginx nginx -t

echo ""
echo "=== Тест 2: Проверка доступности backend из nginx ==="
docker-compose exec nginx wget -O- http://backend:5001/api/products/category 2>&1 | head -20

echo ""
echo "=== Тест 3: Проверка через nginx proxy ==="
docker-compose exec nginx wget -O- http://localhost/api/products/category 2>&1 | head -20

echo ""
echo "=== Тест 4: Логи nginx ==="
docker-compose logs --tail=20 nginx

