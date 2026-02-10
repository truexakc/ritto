#!/bin/bash
set -e

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
            echo -e "${YELLOW}   Рекомендуется обновление${NC}"
            RENEW_CERT=true
        else
            echo -e "${GREEN}   Сертификат действителен еще ${days_left} дней${NC}"
            RENEW_CERT=false
        fi
    else
        echo -e "${YELLOW}⚠️  Не удалось проверить срок действия сертификата${NC}"
        RENEW_CERT=false
    fi
    
    USE_SSL=true
else
    echo -e "${YELLOW}⚠️  SSL сертификаты не найдены. Будет использована HTTP конфигурация${NC}"
    USE_SSL=false
    RENEW_CERT=false
    
    # Переключение на HTTP конфигурацию
    if [ -f "nginx-http-only.conf" ]; then
        echo -e "${BLUE}📝 Переключение на HTTP конфигурацию...${NC}"
        cp nginx.conf nginx-ssl.conf.backup
        cp nginx-http-only.conf nginx.conf
    fi
fi

echo ""
echo -e "${BLUE}🛑 Останавливаем контейнеры...${NC}"
docker compose down

# Обновление сертификата если нужно
if [ "$RENEW_CERT" = true ]; then
    echo ""
    echo -e "${YELLOW}🔐 Обновление SSL сертификата...${NC}"
    
    # Запускаем nginx для webroot метода
    docker compose up -d nginx
    sleep 5
    
    # Проверяем что nginx запущен
    if ! docker compose ps nginx | grep -q "Up"; then
        echo -e "${RED}❌ Nginx не запущен, пропускаем обновление сертификата${NC}"
    else
        # Пробуем обновить сертификат через webroot
        echo -e "${BLUE}   Попытка обновления через webroot...${NC}"
        docker compose run --rm certbot renew --webroot --webroot-path=/var/www/certbot --quiet
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Сертификат успешно обновлен${NC}"
            # Перезагружаем nginx для применения нового сертификата
            docker compose restart nginx
            sleep 2
        else
            echo -e "${YELLOW}⚠️  Обновление сертификата не требуется или произошла ошибка${NC}"
            echo -e "${YELLOW}   Certbot автоматически попробует позже${NC}"
        fi
    fi
    
    # Останавливаем для полного деплоя
    docker compose down
fi

echo ""
echo -e "${BLUE}🔨 Пересобираем образы (это может занять несколько минут)...${NC}"

# Собираем по одному сервису для лучшего контроля
echo -e "${BLUE}  📦 Backend...${NC}"
docker compose build backend

echo -e "${BLUE}  📦 Frontend...${NC}"
docker compose build frontend

echo -e "${BLUE}  📦 SABY Service (без кэша для Go модулей)...${NC}"
docker compose build --no-cache saby-service

echo -e "${BLUE}  📦 Monitor Service (без кэша для Go модулей)...${NC}"
docker compose build --no-cache monitor-service

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

echo -e "${BLUE}  📊 Monitor Service...${NC}"
docker compose up -d monitor-service
sleep 3

echo -e "${BLUE}  🔧 Adminer & Portainer...${NC}"
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
elif [ "$RENEW_CERT" = true ]; then
    echo -e "${GREEN}🔐 SSL сертификат обновлен${NC}"
    echo -e "${GREEN}   Certbot автоматически обновляет сертификаты каждые 12 часов${NC}"
    echo ""
else
    echo -e "${GREEN}🔐 SSL сертификат активен${NC}"
    days_left=$(check_cert_expiry "$DOMAIN")
    if [ "$days_left" -ge 0 ]; then
        echo -e "${GREEN}   Действителен еще ${days_left} дней${NC}"
    fi
    echo -e "${GREEN}   Certbot автоматически обновляет сертификаты каждые 12 часов${NC}"
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
