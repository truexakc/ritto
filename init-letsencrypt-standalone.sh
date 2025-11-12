#!/bin/bash

# Упрощенный скрипт для получения SSL-сертификата Let's Encrypt
# Использует standalone режим (временно останавливает nginx)

# Настройки
domains=(sushiritto.ru)
email="sushi.ritto@mail.ru"
staging=0 # Установите 1 для тестирования

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Получение SSL-сертификата (standalone режим) ===${NC}"
echo ""

# Создание директорий
echo -e "${YELLOW}Создание директорий...${NC}"
mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# Проверка существующих сертификатов
if [ -d "./certbot/conf/live/${domains[0]}" ]; then
  echo -e "${YELLOW}Сертификаты уже существуют!${NC}"
  read -p "Перевыпустить? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отменено."
    exit 1
  fi
  rm -rf ./certbot/conf/live/${domains[0]}
  rm -rf ./certbot/conf/archive/${domains[0]}
  rm -rf ./certbot/conf/renewal/${domains[0]}.conf
fi

# Загрузка параметров TLS
echo -e "${YELLOW}Загрузка параметров TLS...${NC}"
if [ ! -e "./certbot/conf/options-ssl-nginx.conf" ]; then
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "./certbot/conf/options-ssl-nginx.conf"
fi
if [ ! -e "./certbot/conf/ssl-dhparams.pem" ]; then
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "./certbot/conf/ssl-dhparams.pem"
fi

# Остановка nginx (освобождаем порт 80)
echo -e "${YELLOW}Остановка nginx...${NC}"
docker-compose stop nginx

# Формирование аргументов доменов
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# Выбор режима
if [ $staging != "0" ]; then
  staging_arg="--staging"
  echo -e "${YELLOW}Режим: ТЕСТОВЫЙ (staging)${NC}"
else
  staging_arg=""
  echo -e "${GREEN}Режим: PRODUCTION${NC}"
fi

# Получение сертификата в standalone режиме
echo -e "${GREEN}Получение сертификата...${NC}"
echo "Домены: ${domains[@]}"
echo "Email: $email"
echo ""

docker-compose run --rm -p 80:80 --entrypoint "\
  certbot certonly --standalone \
    $staging_arg \
    $domain_args \
    --email $email \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal \
    --non-interactive" certbot

# Проверка результата
if [ ! -d "./certbot/conf/live/${domains[0]}" ]; then
  echo -e "${RED}Ошибка: Не удалось получить сертификат!${NC}"
  echo ""
  echo "Проверьте:"
  echo "1. DNS: nslookup ${domains[0]}"
  echo "2. Порт 80 открыт: sudo ufw status"
  echo "3. Логи: docker-compose logs certbot"
  echo ""
  echo "Запуск nginx обратно..."
  docker-compose up -d nginx
  exit 1
fi

echo -e "${GREEN}Сертификат успешно получен!${NC}"

# Запуск nginx с новым сертификатом
echo -e "${YELLOW}Запуск nginx...${NC}"
docker-compose up -d nginx

# Проверка конфигурации
sleep 2
echo -e "${YELLOW}Проверка nginx...${NC}"
docker-compose exec nginx nginx -t

echo ""
echo -e "${GREEN}=== Готово! ===${NC}"
echo -e "${GREEN}SSL установлен успешно!${NC}"
echo ""
echo "Проверьте: https://${domains[0]}"
echo ""
echo -e "${YELLOW}Важно:${NC}"
echo "1. Сертификат обновляется автоматически каждые 12 часов"
echo "2. Если использовали staging, запустите снова с staging=0"
echo ""
