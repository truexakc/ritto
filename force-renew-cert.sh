#!/bin/bash

# Экстренное обновление истекшего SSL сертификата
# Использует standalone режим (временно останавливает nginx)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="sushiritto.ru"

echo -e "${RED}🚨 ЭКСТРЕННОЕ ОБНОВЛЕНИЕ SSL СЕРТИФИКАТА${NC}"
echo -e "${YELLOW}Сертификат истек или истекает сегодня!${NC}"
echo ""

# Остановка ВСЕХ контейнеров (освобождаем порт 80)
echo -e "${BLUE}1. Остановка всех контейнеров...${NC}"
docker compose down
sleep 2

# Удаление lock файла если есть
if [ -f "./certbot/conf/.certbot.lock" ]; then
    echo -e "${YELLOW}   Удаление lock файла...${NC}"
    rm -f ./certbot/conf/.certbot.lock
fi

# Обновление сертификата в standalone режиме
echo -e "${BLUE}2. Обновление сертификата (standalone режим)...${NC}"
echo -e "${YELLOW}   Домен: ${DOMAIN}${NC}"
echo ""

# Используем первый найденный аккаунт (самый новый)
ACCOUNT_ID="3b05c60630371737fcfb3ec4a9bf35ed"

docker compose run --rm --no-deps -p 80:80 --entrypoint "\
  certbot certonly --standalone \
    -d ${DOMAIN} \
    -d www.${DOMAIN} \
    --force-renewal \
    --non-interactive \
    --agree-tos \
    --email sushi.ritto@mail.ru \
    --rsa-key-size 4096 \
    --account ${ACCOUNT_ID}" certbot

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Сертификат успешно обновлен!${NC}"
    
    # Запуск всех сервисов
    echo -e "${BLUE}3. Запуск всех сервисов...${NC}"
    docker compose up -d
    
    sleep 5
    
    # Проверка конфигурации nginx
    if docker compose exec nginx nginx -t > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Nginx успешно запущен${NC}"
    else
        echo -e "${RED}   ❌ Ошибка конфигурации Nginx!${NC}"
        docker compose exec nginx nginx -t
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Готово!${NC}"
    echo -e "${BLUE}   Проверьте сайт: https://${DOMAIN}${NC}"
    
    # Проверка нового срока
    if [ -f "./certbot/conf/live/${DOMAIN}/cert.pem" ]; then
        expiry_date=$(openssl x509 -enddate -noout -in "./certbot/conf/live/${DOMAIN}/cert.pem" | cut -d= -f2)
        echo -e "${GREEN}   Сертификат действителен до: ${expiry_date}${NC}"
    fi
else
    echo ""
    echo -e "${RED}❌ Ошибка обновления сертификата!${NC}"
    echo ""
    echo -e "${YELLOW}Возможные причины:${NC}"
    echo "1. DNS не указывает на этот сервер"
    echo "2. Порт 80 недоступен из интернета"
    echo "3. Firewall блокирует порт 80"
    echo ""
    echo -e "${BLUE}Проверьте:${NC}"
    echo "  DNS: nslookup ${DOMAIN}"
    echo "  Порт 80: sudo netstat -tlnp | grep :80"
    echo "  Логи: docker compose logs certbot"
    echo ""
    echo -e "${YELLOW}Запускаю все сервисы обратно...${NC}"
    docker compose up -d
    exit 1
fi

echo ""
