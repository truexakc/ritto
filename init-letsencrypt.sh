#!/bin/bash

# Скрипт для первоначального получения SSL-сертификата Let's Encrypt
# Использование: ./init-letsencrypt.sh

# Настройки
domains=(sushiritto.ru)  # Убрали www, так как нет DNS-записи для www
email="sushi.ritto@mail.ru"
staging=0 # Установите 1 для тестирования (staging), 0 для production

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Инициализация Let's Encrypt SSL-сертификата ===${NC}"
echo ""

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

# Шаг 1: Используем HTTP-only конфигурацию для получения сертификата
echo -e "${YELLOW}Шаг 1: Переключение на HTTP-only конфигурацию...${NC}"
if [ -f "nginx-http-only.conf" ]; then
  cp nginx.conf nginx.conf.backup
  cp nginx-http-only.conf nginx.conf
  echo "Создана резервная копия: nginx.conf.backup"
fi

# Перезапуск nginx с HTTP-only конфигурацией
echo -e "${YELLOW}Перезапуск nginx...${NC}"
docker-compose down nginx
docker-compose up -d nginx

# Небольшая пауза для запуска nginx
sleep 3

# Шаг 2: Получение настоящего сертификата
echo -e "${GREEN}Шаг 2: Получение SSL-сертификата Let's Encrypt...${NC}"
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
echo -e "${YELLOW}Запрос сертификата...${NC}"
docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $domain_args \
    --email $email \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal \
    --non-interactive" certbot

# Проверка успешности получения сертификата
if [ ! -d "./certbot/conf/live/${domains[0]}" ]; then
  echo -e "${RED}Ошибка: Не удалось получить сертификат!${NC}"
  echo "Проверьте:"
  echo "1. DNS-запись для ${domains[0]} указывает на этот сервер"
  echo "2. Порт 80 открыт и доступен из интернета"
  echo "3. Логи: docker-compose logs certbot"
  
  # Восстанавливаем оригинальную конфигурацию
  if [ -f "nginx.conf.backup" ]; then
    mv nginx.conf.backup nginx.conf
    docker-compose restart nginx
  fi
  exit 1
fi

# Шаг 3: Восстанавливаем полную конфигурацию с HTTPS
echo -e "${YELLOW}Шаг 3: Переключение на HTTPS конфигурацию...${NC}"
if [ -f "nginx.conf.backup" ]; then
  mv nginx.conf.backup nginx.conf
fi

# Перезапуск nginx с полной конфигурацией
echo -e "${YELLOW}Перезапуск nginx с SSL...${NC}"
docker-compose restart nginx

# Проверка конфигурации nginx
echo -e "${YELLOW}Проверка конфигурации nginx...${NC}"
docker-compose exec nginx nginx -t

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
echo ""
echo "Если хотите добавить www.sushiritto.ru:"
echo "1. Создайте DNS A-запись для www.sushiritto.ru"
echo "2. Добавьте домен в массив domains в скрипте"
echo "3. Запустите скрипт снова"
