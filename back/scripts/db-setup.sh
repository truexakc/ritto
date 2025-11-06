#!/bin/bash

# Скрипт для настройки и управления базой данных

set -e

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка наличия docker-compose
if ! command -v docker-compose &> /dev/null; then
    log_error "docker-compose не установлен"
    exit 1
fi

# Функции управления БД
start_db() {
    log_info "Запуск PostgreSQL контейнера..."
    docker-compose up -d postgres
    log_info "Ожидание готовности БД..."
    sleep 5
    log_info "PostgreSQL запущен"
}

stop_db() {
    log_info "Остановка PostgreSQL контейнера..."
    docker-compose stop postgres
    log_info "PostgreSQL остановлен"
}

reset_db() {
    log_warn "Сброс базы данных удалит все данные!"
    read -p "Продолжить? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Остановка контейнеров..."
        docker-compose down
        
        log_info "Удаление volume..."
        docker volume rm ritto_postgres_data 2>/dev/null || true
        
        log_info "Запуск с новой БД..."
        docker-compose up -d postgres
        
        log_info "База данных сброшена и миграции применены"
    else
        log_info "Отменено"
    fi
}

migrate() {
    log_info "Применение миграций..."
    docker-compose exec -T postgres psql -U ritto_user -d ritto_db -f /docker-entrypoint-initdb.d/001_initial_schema.sql
    docker-compose exec -T postgres psql -U ritto_user -d ritto_db -f /docker-entrypoint-initdb.d/002_seed_data.sql
    log_info "Миграции применены"
}

connect() {
    log_info "Подключение к базе данных..."
    docker-compose exec postgres psql -U ritto_user -d ritto_db
}

backup() {
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    log_info "Создание резервной копии..."
    docker-compose exec -T postgres pg_dump -U ritto_user ritto_db > "$BACKUP_FILE"
    log_info "Резервная копия создана: $BACKUP_FILE"
}

restore() {
    if [ -z "$1" ]; then
        log_error "Укажите файл резервной копии: ./db-setup.sh restore backup.sql"
        exit 1
    fi
    
    log_info "Восстановление из резервной копии $1..."
    docker-compose exec -T postgres psql -U ritto_user -d ritto_db < "$1"
    log_info "Данные восстановлены"
}

logs() {
    log_info "Показ логов PostgreSQL..."
    docker-compose logs -f postgres
}

# Главное меню
case "$1" in
    start)
        start_db
        ;;
    stop)
        stop_db
        ;;
    reset)
        reset_db
        ;;
    migrate)
        migrate
        ;;
    connect|psql)
        connect
        ;;
    backup)
        backup
        ;;
    restore)
        restore "$2"
        ;;
    logs)
        logs
        ;;
    *)
        echo "Использование: $0 {start|stop|reset|migrate|connect|backup|restore|logs}"
        echo ""
        echo "Команды:"
        echo "  start    - Запустить PostgreSQL контейнер"
        echo "  stop     - Остановить PostgreSQL контейнер"
        echo "  reset    - Сбросить БД и применить миграции"
        echo "  migrate  - Применить миграции"
        echo "  connect  - Подключиться к БД через psql"
        echo "  backup   - Создать резервную копию БД"
        echo "  restore  - Восстановить из резервной копии"
        echo "  logs     - Показать логи PostgreSQL"
        exit 1
        ;;
esac

exit 0

