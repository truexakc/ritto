#!/bin/bash
set -e

echo "🔍 Проверка окружения..."

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден! Скопируйте .env.example в .env и настройте"
    exit 1
fi

# Проверка SSL сертификатов
if [ -d "./certbot/conf/live/sushiritto.ru" ]; then
    echo "✅ SSL сертификаты найдены"
    USE_SSL=true
else
    echo "⚠️  SSL сертификаты не найдены. Будет использована HTTP конфигурация"
    USE_SSL=false
    
    # Переключение на HTTP конфигурацию
    if [ -f "nginx-http-only.conf" ]; then
        echo "📝 Переключение на HTTP конфигурацию..."
        cp nginx.conf nginx-ssl.conf.backup
        cp nginx-http-only.conf nginx.conf
    fi
fi

echo ""
echo "🛑 Останавливаем контейнеры..."
docker compose down

echo ""
echo "🔨 Пересобираем образы (это может занять несколько минут)..."

# Собираем по одному сервису для лучшего контроля
echo "  📦 Backend..."
docker compose build backend

echo "  📦 Frontend..."
docker compose build frontend

echo "  📦 SABY Service (без кэша для Go модулей)..."
docker compose build --no-cache saby-service

echo "  📦 Monitor Service (без кэша для Go модулей)..."
docker compose build --no-cache monitor-service

echo ""
echo "🚀 Запуск сервисов..."

echo "  🗄️  PostgreSQL..."
docker compose up -d postgres
echo "     Ожидание готовности БД (15 секунд)..."
sleep 15

# Проверка здоровья PostgreSQL
if docker compose ps postgres | grep -q "healthy"; then
    echo "     ✅ PostgreSQL готов"
else
    echo "     ⚠️  PostgreSQL еще не готов, ждем еще 10 секунд..."
    sleep 10
fi

echo "  🔧 Backend..."
docker compose up -d backend
sleep 5

# Проверка логов backend
if docker compose logs backend | grep -q "Server running"; then
    echo "     ✅ Backend запущен"
else
    echo "     ⚠️  Backend может быть еще не готов, проверьте логи: docker compose logs backend"
fi

echo "  🎨 Frontend..."
docker compose up -d frontend
sleep 3

echo "  🔌 SABY Service..."
docker compose up -d saby-service
sleep 3

echo "  📊 Monitor Service..."
docker compose up -d monitor-service
sleep 3

echo "  🔧 Adminer & Portainer..."
docker compose up -d adminer portainer
sleep 2

echo "  🌐 Nginx..."
docker compose up -d nginx

if [ "$USE_SSL" = false ]; then
    echo "  🔐 Certbot (для получения SSL)..."
    docker compose up -d certbot
fi

echo ""
echo "✅ Деплой завершен!"
echo ""
echo "📊 Статус контейнеров:"
docker compose ps

echo ""
echo "📝 Полезные команды:"
echo "  - Просмотр логов всех сервисов: docker compose logs -f"
echo "  - Просмотр логов backend: docker compose logs -f backend"
echo "  - Просмотр логов nginx: docker compose logs -f nginx"
echo "  - Статус контейнеров: docker compose ps"
echo "  - Перезапуск сервиса: docker compose restart <service_name>"
echo ""

if [ "$USE_SSL" = false ]; then
    echo "⚠️  ВАЖНО: SSL сертификаты не настроены!"
    echo "   Для получения SSL сертификатов выполните:"
    echo "   ./init-letsencrypt.sh"
    echo ""
fi
