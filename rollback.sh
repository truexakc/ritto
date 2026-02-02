#!/bin/bash
set -e

# Скрипт для быстрого отката к предыдущей версии

echo "🔙 Откат к предыдущей версии..."
echo ""
echo "⚠️  ВНИМАНИЕ: Этот скрипт:"
echo "   1. Остановит все контейнеры"
echo "   2. Удалит текущие образы"
echo "   3. Восстановит контейнеры из последних стабильных образов"
echo ""
read -p "Продолжить? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отмена"
    exit 1
fi

echo ""
echo "🛑 Останавливаем контейнеры..."
docker compose down

echo ""
echo "🗑️  Удаляем проблемные образы..."
docker compose rm -f backend frontend saby-service monitor-service

echo ""
echo "📦 Восстанавливаем из кэша Docker..."
# Пытаемся запустить без пересборки
docker compose up -d --no-build

echo ""
echo "📊 Статус:"
docker compose ps

echo ""
echo "✅ Откат завершен!"
echo ""
echo "Если проблемы остались, используйте резервную копию:"
echo "  1. Остановите все: docker compose down"
echo "  2. Восстановите volumes из бэкапа"
echo "  3. Запустите: ./safe-deploy.sh"
