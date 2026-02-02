#!/bin/bash
set -e

echo "🔧 Исправление Go модулей для сборки в Docker..."
echo ""

# Удаляем старые go.sum файлы
echo "🗑️  Удаление старых go.sum файлов..."
rm -f monitor-service/go.sum
rm -f saby-service/go.sum

echo "✅ Готово!"
echo ""
echo "📝 Теперь запустите сборку Docker:"
echo "   ./safe-deploy.sh"
echo ""
echo "ℹ️  Docker будет использовать Go 1.23 для сборки,"
echo "   что решит все проблемы с зависимостями."
