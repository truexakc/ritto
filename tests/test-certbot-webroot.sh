#!/bin/bash

# Скрипт для тестирования webroot режима certbot

echo "=== Тест webroot для certbot ==="
echo ""

# Создаем тестовый файл
echo "1. Создание тестового файла..."
mkdir -p ./certbot/www/.well-known/acme-challenge/
echo "test-file-content" > ./certbot/www/.well-known/acme-challenge/test-file.txt

# Проверяем права
echo "2. Проверка прав на файл..."
ls -la ./certbot/www/.well-known/acme-challenge/test-file.txt

# Запускаем nginx если не запущен
echo "3. Запуск nginx..."
docker-compose up -d nginx
sleep 2

# Проверяем доступность файла изнутри контейнера
echo "4. Проверка файла внутри nginx контейнера..."
docker-compose exec nginx ls -la /var/www/certbot/.well-known/acme-challenge/ || echo "Директория не найдена!"

# Проверяем доступность через HTTP
echo "5. Проверка доступности через HTTP..."
echo "   Локально:"
curl -v http://localhost/.well-known/acme-challenge/test-file.txt 2>&1 | grep -E "(HTTP|test-file-content|404|403)"

echo ""
echo "   Через домен (если DNS настроен):"
curl -v http://sushiritto.ru/.well-known/acme-challenge/test-file.txt 2>&1 | grep -E "(HTTP|test-file-content|404|403)"

# Проверяем конфигурацию nginx
echo ""
echo "6. Проверка конфигурации nginx..."
docker-compose exec nginx nginx -t

echo ""
echo "7. Проверка location в nginx..."
docker-compose exec nginx cat /etc/nginx/nginx.conf | grep -A 3 "well-known"

# Очистка
echo ""
echo "8. Очистка тестового файла..."
rm -f ./certbot/www/.well-known/acme-challenge/test-file.txt

echo ""
echo "=== Тест завершен ==="
echo ""
echo "Если видите 'test-file-content' в ответе - webroot работает!"
echo "Если 404/403 или Connection refused - есть проблема с nginx конфигурацией"
