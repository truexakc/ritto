#!/bin/bash

# Скрипт для первоначального получения SSL-сертификата Let's Encrypt
# Использование: ./init-letsencrypt.sh

# Настройки
domains=(sushiritto.ru www.sushiritto.ru)
email="your-email@example.com" # Замените на ваш email
staging=0 # Установите 1 для тестирования (staging), 0 для production

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Инициализация Let's Encrypt SSL-сертификата ===${NC}"
echo ""

# Проверка email
if [ "$email" = "your-email@example.com" ]; then
  echo -e "${RED}Ошибка: Пожалуйста, укажите ваш email в скрипте!${NC}"
  echo "Откройте файл init-letsencrypt.sh и замените 'your-email@example.com' на ваш реальный email"
  exit 1
fi

# Создание необходимых директорий
echo -e "${YELLOW}Создание директорий для сертификатов...${NC}"
mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# Проверка существующих сертификатов
if [ -d "./certbot/conf/live/${domains[0]}" ]; then
  echo -e "${YELLOW}Внимание: Сертификаты уже существуют!${NC}"
  read -p "Хотите перевыпустить сертификаты? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отменено."
    exit 1
  fi
  echo -e "${YELLOW}Удаление старых сертификатов...${NC}"
  rm -rf ./certbot/conf/live/${domains[0]}
  rm -rf ./certbot/conf/archive/${domains[0]}
  rm -rf ./certbot/conf/renewal/${domains[0]}.conf
fi

# Загрузка рекомендуемых параметров TLS
echo -e "${YELLOW}Загрузка рекомендуемых параметров TLS...${NC}"
if [ ! -e "./certbot/conf/options-ssl-nginx.conf" ] || [ ! -e "./certbot/conf/ssl-dhparams.pem" ]; then
  echo "Загрузка options-ssl-nginx.conf..."
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "./certbot/conf/options-ssl-nginx.conf"
  echo "Загрузка ssl-dhparams.pem..."
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "./certbot/conf/ssl-dhparams.pem"
fi

# Создание временного самоподписанного сертификата
echo -e "${YELLOW}Создание временного самоподписанного сертификата...${NC}"
path="/etc/letsencrypt/live/${domains[0]}"
mkdir -p "./certbot/conf/live/${domains[0]}"
docker-compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:2048 -days 1\
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot

# Запуск nginx
echo -e "${YELLOW}Запуск nginx...${NC}"
docker-compose up -d nginx

# Удаление временного сертификата
echo -e "${YELLOW}Удаление временного сертификата...${NC}"
docker-compose run --rm --entrypoint "\
  rm -rf /etc/letsencrypt/live/${domains[0]} && \
  rm -rf /etc/letsencrypt/archive/${domains[0]} && \
  rm -rf /etc/letsencrypt/renewal/${domains[0]}.conf" certbot

# Получение настоящего сертификата
echo -e "${GREEN}Получение настоящего SSL-сертификата Let's Encrypt...${NC}"
echo "Домены: ${domains[@]}"
echo "Email: $email"

# Формирование списка доменов для certbot
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# Выбор сервера (staging или production)
if [ $staging != "0" ]; then
  staging_arg="--staging"
  echo -e "${YELLOW}Режим: ТЕСТОВЫЙ (staging)${NC}"
else
  staging_arg=""
  echo -e "${GREEN}Режим: PRODUCTION${NC}"
fi

# Запрос сертификата
docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $domain_args \
    --email $email \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal \
    --non-interactive" certbot

# Перезагрузка nginx
echo -e "${YELLOW}Перезагрузка nginx...${NC}"
docker-compose exec nginx nginx -s reload

echo ""
echo -e "${GREEN}=== Готово! ===${NC}"
echo -e "${GREEN}SSL-сертификат успешно установлен!${NC}"
echo ""
echo "Проверьте ваш сайт: https://${domains[0]}"
echo ""
echo -e "${YELLOW}Важно:${NC}"
echo "1. Сертификат будет автоматически обновляться каждые 12 часов"
echo "2. Если использовали staging режим, запустите скрипт снова с staging=0"
echo "3. После проверки работы SSL раскомментируйте HSTS в nginx.conf"
