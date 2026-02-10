#!/bin/bash

# Скрипт для ручного обновления SSL сертификата
# Использование: ./renew-cert.sh

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="sushiritto.ru"

echo -e "${BLUE}🔐 Обновление SSL сертификата для ${DOMAIN}${NC}"
echo ""

# Проверка наличия сертификата
if [ ! -d "./certbot/conf/live/${DOMAIN}" ]; then
    echo -e "${RED}❌ Сертификат не найден!${NC}"
    echo -e "${YELLOW}   Для первоначального получения сертификата выполните:${NC}"
    echo -e "${BLUE}   ./init-letsencrypt.sh${NC}"
    exit 1
fi

# Функция проверки срока действия
check_cert_expiry() {
    local cert_path="./certbot/conf/live/${DOMAIN}/cert.pem"
    
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

# Проверка текущего срока
days_left=$(check_cert_expiry)

if [ "$days_left" -ge 0 ]; then
    echo -e "${BLUE}📅 Текущий сертификат действителен еще ${days_left} дней${NC}"
    
    if [ "$days_left" -gt 30 ]; then
        echo -e "${YELLOW}⚠️  Let's Encrypt не позволяет обновлять сертификаты более чем за 30 дней до истечения${NC}"
        read -p "Продолжить принудительное обновление? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Отменено."
            exit 0
        fi
        FORCE_RENEW="--force-renewal"
    else
        FORCE_RENEW=""
    fi
else
    echo -e "${YELLOW}⚠️  Не удалось определить срок действия сертификата${NC}"
    FORCE_RENEW=""
fi

echo ""
echo -e "${BLUE}🔄 Запуск процесса обновления...${NC}"

# Убеждаемся что nginx и certbot запущены
echo -e "${BLUE}   Проверка контейнеров...${NC}"
docker compose up -d nginx certbot

sleep 3

# Обновление сертификата
echo -e "${BLUE}   Обновление сертификата...${NC}"
if [ -n "$FORCE_RENEW" ]; then
    docker compose run --rm certbot renew $FORCE_RENEW
else
    docker compose run --rm certbot renew
fi

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Сертификат успешно обновлен!${NC}"
    
    # Перезагрузка nginx для применения нового сертификата
    echo -e "${BLUE}   Перезагрузка nginx...${NC}"
    docker compose restart nginx
    
    sleep 2
    
    # Проверка конфигурации
    if docker compose exec nginx nginx -t > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Nginx успешно перезагружен${NC}"
    else
        echo -e "${RED}   ❌ Ошибка конфигурации Nginx!${NC}"
        docker compose exec nginx nginx -t
    fi
    
    # Проверка нового срока
    new_days_left=$(check_cert_expiry)
    if [ "$new_days_left" -ge 0 ]; then
        echo ""
        echo -e "${GREEN}📅 Новый сертификат действителен ${new_days_left} дней${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Готово!${NC}"
    echo -e "${BLUE}   Проверьте сайт: https://${DOMAIN}${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Обновление не выполнено${NC}"
    echo -e "${YELLOW}   Возможные причины:${NC}"
    echo "   - Сертификат еще не требует обновления (осталось > 30 дней)"
    echo "   - Проблемы с доступом к серверу Let's Encrypt"
    echo "   - Проблемы с DNS или доступностью домена"
    echo ""
    echo -e "${BLUE}   Проверьте логи:${NC}"
    echo "   docker compose logs certbot"
fi

echo ""
