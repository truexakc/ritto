#!/bin/bash
set -e

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# БЕЗОПАСНЫЙ ДЕПЛОЙ С ОГРАНИЧЕНИЕМ РЕСУРСОВ
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# Оптимизировано для серверов с ограниченными ресурсами (1 vCPU, 1GB RAM)
#
# ЗАЩИТА ОТ ПЕРЕГРУЗКИ:
#   - Сборка по одному сервису с паузами
#   - Ограничение памяти Docker (--memory)
#   - Низкий приоритет CPU (nice -n 19)
#   - NODE_OPTIONS=--max-old-space-size=512 для frontend
#
# ВРЕМЯ ВЫПОЛНЕНИЯ: 15-25 минут
#
# АЛЬТЕРНАТИВЫ:
#   - Только frontend: ./scripts/build-frontend-only.sh (5-15 мин)
#   - Быстрое обновление: ./scripts/quick-update.sh <service>
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Проверка окружения...${NC}"

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo -e "${RED}❌ Файл .env не найден! Скопируйте .env.example в .env и настройте${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🛑 Останавливаем все контейнеры...${NC}"
docker compose down

echo ""
echo -e "${BLUE}🧹 Очистка неиспользуемых ресурсов Docker...${NC}"
echo -e "${YELLOW}   Освобождаем место перед сборкой...${NC}"
docker system prune -f
echo -e "${GREEN}   ✅ Очистка завершена${NC}"

echo ""
echo -e "${BLUE}💾 Проверка свободного места...${NC}"
DISK_AVAILABLE=$(df -h . | awk 'NR==2 {print $4}')
echo "   Доступно на диске: ${DISK_AVAILABLE}"

FREE_MEM=$(free -m 2>/dev/null | awk 'NR==2{print $7}' || echo "N/A")
if [ "$FREE_MEM" != "N/A" ]; then
    echo "   Доступно памяти: ${FREE_MEM} MB"
    if [ "$FREE_MEM" -lt 300 ]; then
        echo -e "${YELLOW}   ⚠️  Мало свободной памяти! Сборка может быть медленной${NC}"
    fi
fi

# Функция проверки срока действия сертификата
check_cert_expiry() {
    local domain=$1
    local cert_path="./certbot/conf/live/${domain}/cert.pem"
    
    if [ -f "$cert_path" ]; then
        local expiry_date=$(openssl x509 -enddate -noout -in "$cert_path" | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry_date" +%s 2>/dev/null)
        local current_epoch=$(date +%s)
        local days_left=$(( ($expiry_epoch - $current_epoch) / 86400 ))
        
        echo "$days_left"
    else
        echo "-1"
    fi
}

# Проверка SSL сертификатов
DOMAIN="sushiritto.ru"
if [ -d "./certbot/conf/live/${DOMAIN}" ]; then
    echo -e "${GREEN}✅ SSL сертификаты найдены${NC}"
    
    # Проверка срока действия
    days_left=$(check_cert_expiry "$DOMAIN")
    
    if [ "$days_left" -ge 0 ]; then
        if [ "$days_left" -lt 30 ]; then
            echo -e "${YELLOW}⚠️  Сертификат истекает через ${days_left} дней!${NC}"
            echo -e "${YELLOW}   Certbot автоматически обновит его при следующей проверке${NC}"
        else
            echo -e "${GREEN}   Сертификат действителен еще ${days_left} дней${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Не удалось проверить срок действия сертификата${NC}"
    fi
    
    USE_SSL=true
else
    echo -e "${YELLOW}⚠️  SSL сертификаты не найдены. Будет использована HTTP конфигурация${NC}"
    USE_SSL=false
    
    # Переключение на HTTP конфигурацию
    if [ -f "nginx-http-only.conf" ]; then
        echo -e "${BLUE}📝 Переключение на HTTP конфигурацию...${NC}"
        cp nginx.conf nginx-ssl.conf.backup
        cp nginx-http-only.conf nginx.conf
    fi
fi

echo ""
echo -e "${BLUE} Пересобираем образы (безопасно, по одному)...${NC}"
echo -e "${YELLOW}⚠️  ВАЖНО: На серверах с ограниченными ресурсами (1GB RAM)${NC}"
echo -e "${YELLOW}   сборка может занять 10-15 минут. Не прерывайте процесс!${NC}"
echo ""

# Ограничиваем ресурсы Docker для сборки
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Собираем по одному сервису с паузами для восстановления ресурсов
echo -e "${BLUE}  📦 Backend (быстрая сборка)...${NC}"
docker compose build --memory=512m backend
echo -e "${GREEN}     ✅ Backend собран${NC}"
sleep 5  # Пауза для освобождения ресурсов

echo ""
echo -e "${BLUE}  📦 Frontend (медленная сборка, ~5-10 минут)...${NC}"
echo -e "${YELLOW}     ⏳ Сборка TypeScript + React может загрузить сервер${NC}"
echo -e "${YELLOW}     💡 Dockerfile использует NODE_OPTIONS=--max-old-space-size=512${NC}"
# Используем nice для снижения приоритета процесса
nice -n 19 docker compose build --memory=700m frontend
echo -e "${GREEN}     ✅ Frontend собран${NC}"
sleep 10  # Длительная пауза для восстановления после тяжелой сборки

echo ""
echo -e "${BLUE}  📦 SABY Service (Go, средняя сборка)...${NC}"
docker compose build --no-cache --memory=400m saby-service
echo -e "${GREEN}     ✅ SABY Service собран${NC}"
sleep 5

echo ""
echo -e "${BLUE}🚀 Запуск сервисов...${NC}"

echo -e "${BLUE}  🗄️  PostgreSQL...${NC}"
docker compose up -d postgres
echo -e "${BLUE}     Ожидание готовности БД (15 секунд)...${NC}"
sleep 15

# Проверка здоровья PostgreSQL
if docker compose ps postgres | grep -q "healthy"; then
    echo -e "${GREEN}     ✅ PostgreSQL готов${NC}"
else
    echo -e "${YELLOW}     ⚠️  PostgreSQL еще не готов, ждем еще 10 секунд...${NC}"
    sleep 10
fi

echo -e "${BLUE}  🔧 Backend...${NC}"
docker compose up -d backend
sleep 5

# Проверка логов backend
if docker compose logs backend | grep -q "Server running"; then
    echo -e "${GREEN}     ✅ Backend запущен${NC}"
else
    echo -e "${YELLOW}     ⚠️  Backend может быть еще не готов, проверьте логи: docker compose logs backend${NC}"
fi

echo -e "${BLUE}  🎨 Frontend...${NC}"
docker compose up -d frontend
sleep 3

echo -e "${BLUE}  🔌 SABY Service...${NC}"
docker compose up -d saby-service
sleep 3

echo -e "${BLUE}   Adminer & Portainer...${NC}"
docker compose up -d adminer portainer
sleep 2

echo -e "${BLUE}  🌐 Nginx...${NC}"
docker compose up -d nginx

# Запуск certbot для автоматического обновления
echo -e "${BLUE}  🔐 Certbot (автообновление сертификатов)...${NC}"
docker compose up -d certbot

# Проверка конфигурации nginx
sleep 2
if docker compose exec nginx nginx -t > /dev/null 2>&1; then
    echo -e "${GREEN}     ✅ Конфигурация Nginx корректна${NC}"
else
    echo -e "${RED}     ❌ Ошибка в конфигурации Nginx!${NC}"
    docker compose exec nginx nginx -t
fi

echo ""
echo -e "${GREEN}✅ Деплой завершен!${NC}"
echo ""
echo -e "${BLUE}📊 Статус контейнеров:${NC}"
docker compose ps

echo ""
echo -e "${BLUE}📝 Полезные команды:${NC}"
echo "  - Просмотр логов всех сервисов: docker compose logs -f"
echo "  - Просмотр логов backend: docker compose logs -f backend"
echo "  - Просмотр логов nginx: docker compose logs -f nginx"
echo "  - Просмотр логов certbot: docker compose logs -f certbot"
echo "  - Статус контейнеров: docker compose ps"
echo "  - Перезапуск сервиса: docker compose restart <service_name>"
echo ""

# SSL статус и рекомендации
if [ "$USE_SSL" = false ]; then
    echo -e "${YELLOW}⚠️  ВАЖНО: SSL сертификаты не настроены!${NC}"
    echo -e "${YELLOW}   Для получения SSL сертификатов выполните:${NC}"
    echo -e "${BLUE}   ./init-letsencrypt.sh${NC}"
    echo ""
else
    echo -e "${GREEN}🔐 SSL сертификат активен${NC}"
    days_left=$(check_cert_expiry "$DOMAIN")
    if [ "$days_left" -ge 0 ]; then
        if [ "$days_left" -lt 30 ]; then
            echo -e "${YELLOW}   ⚠️  Истекает через ${days_left} дней - требуется обновление!${NC}"
            echo -e "${YELLOW}   Для ручного обновления выполните: ./renew-cert.sh${NC}"
        else
            echo -e "${GREEN}   Действителен еще ${days_left} дней${NC}"
        fi
    fi
    echo -e "${GREEN}   Certbot автоматически обновит сертификат за 30 дней до истечения${NC}"
    echo ""
fi

# Проверка доступности сайта
echo -e "${BLUE}🌐 Проверка доступности:${NC}"
if [ "$USE_SSL" = true ]; then
    echo "   HTTPS: https://${DOMAIN}"
    echo "   HTTP: http://${DOMAIN} (редирект на HTTPS)"
else
    echo "   HTTP: http://${DOMAIN}"
fi
echo ""
