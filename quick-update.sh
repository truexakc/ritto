#!/bin/bash
set -e

# Скрипт для быстрого обновления без полной пересборки
# Использовать когда нужно обновить только код без изменения зависимостей

SERVICE=$1

if [ -z "$SERVICE" ]; then
    echo "Использование: ./quick-update.sh <service_name>"
    echo ""
    echo "Доступные сервисы:"
    echo "  - backend"
    echo "  - frontend"
    echo "  - saby-service"
    echo "  - monitor-service"
    echo "  - all (обновить все)"
    echo ""
    echo "Пример: ./quick-update.sh backend"
    exit 1
fi

update_service() {
    local service=$1
    echo "🔄 Обновление $service..."
    
    # Останавливаем сервис
    docker compose stop $service
    
    # Пересобираем (используем кэш)
    docker compose build $service
    
    # Запускаем
    docker compose up -d $service
    
    echo "✅ $service обновлен"
    
    # Показываем логи
    echo "📝 Последние логи:"
    docker compose logs --tail=20 $service
}

if [ "$SERVICE" = "all" ]; then
    echo "🔄 Обновление всех сервисов..."
    update_service backend
    sleep 3
    update_service frontend
    sleep 3
    update_service saby-service
    sleep 3
    update_service monitor-service
    
    echo ""
    echo "✅ Все сервисы обновлены!"
    docker compose ps
else
    update_service $SERVICE
fi

echo ""
echo "Для просмотра логов: docker compose logs -f $SERVICE"
