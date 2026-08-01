#!/bin/bash
set -e

echo "🔄 Пересборка Go сервисов без кэша..."
echo ""
echo "⚠️  Это очистит кэш Docker для Go сервисов"
echo "   и пересоберет их с нуля."
echo ""

# Останавливаем Go сервисы
echo "🛑 Останавливаем Go сервисы..."
docker compose stop saby-service monitor-service

# Удаляем старые образы
echo "🗑️  Удаляем старые образы..."
docker compose rm -f saby-service monitor-service
docker rmi ritto-saby-service ritto-monitor-service 2>/dev/null || true

# Пересобираем без кэша
echo ""
echo "🔨 Пересборка SABY Service..."
docker compose build --no-cache --progress=plain saby-service

echo ""
echo "🔨 Пересборка Monitor Service..."
docker compose build --no-cache --progress=plain monitor-service

# Запускаем
echo ""
echo "🚀 Запуск сервисов..."
docker compose up -d saby-service monitor-service

echo ""
echo "✅ Готово!"
echo ""
echo "📝 Проверьте логи:"
echo "   docker compose logs -f saby-service"
echo "   docker compose logs -f monitor-service"
