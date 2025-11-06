# Инструкция по деплою Ritto на VPS

## Предварительные требования

На VPS должны быть установлены:
- Docker
- Docker Compose
- Git

## Шаги для деплоя

### 1. Подключение к серверу

```bash
ssh root@83.166.246.163
```

### 2. Установка Docker и Docker Compose (если еще не установлены)

```bash
# Обновление пакетов
apt update && apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установка Docker Compose
apt install docker-compose -y

# Проверка установки
docker --version
docker-compose --version
```

### 3. Клонирование репозитория

```bash
cd /opt
git clone <your-repo-url> ritto
cd ritto
```

### 4. Настройка переменных окружения

Отредактируйте файл `.env` и замените placeholder значения:

```bash
nano .env
```

**Обязательно замените:**
- `{{CHANGE_THIS_SECURE_PASSWORD}}` - на сильный пароль для PostgreSQL
- `{{CHANGE_THIS_JWT_SECRET}}` - на случайную строку для JWT (можно сгенерировать: `openssl rand -base64 32`)

Добавьте остальные необходимые ключи:
- STRIPE_SECRET_KEY (если используется Stripe)
- SUPABASE_URL и SUPABASE_ANON_KEY (если используется Supabase)
- SBIS настройки (если используется SBIS)

### 5. Запуск проекта

```bash
# Сборка и запуск всех сервисов
docker-compose up -d --build

# Проверка статуса контейнеров
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

### 6. Проверка работы

Откройте в браузере: `http://83.166.246.163`

API доступен по адресу: `http://83.166.246.163/api`

### 7. Настройка Portainer (мониторинг Docker)

Portainer предоставляет веб-интерфейс для управления Docker контейнерами.

```bash
# Откройте в браузере
http://83.166.246.163:9000
```

При первом запуске:
1. Создайте admin аккаунт (логин и пароль)
2. Выберите "Get Started" для локального Docker окружения
3. В интерфейсе будут доступны:
   - Список всех контейнеров с их статусом
   - Логи контейнеров в реальном времени
   - Использование ресурсов (CPU, RAM, сеть)
   - Управление volumes, networks, images
   - Консоль для доступа к контейнерам

### 8. Полезные команды

```bash
# Остановка всех сервисов
docker-compose down

# Перезапуск
docker-compose restart

# Просмотр логов конкретного сервиса
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Вход в контейнер
docker exec -it ritto-backend sh

# Обновление кода и перезапуск
git pull
docker-compose down
docker-compose up -d --build
```

### 9. Настройка автозапуска

Docker Compose автоматически перезапустит контейнеры после перезагрузки сервера благодаря параметру `restart: unless-stopped`.

### 10. Настройка файрвола (опционально)

```bash
# Установка ufw
apt install ufw -y

# Разрешить SSH
ufw allow 22/tcp

# Разрешить HTTP
ufw allow 80/tcp

# Разрешить Portainer
ufw allow 9000/tcp

# Включить файрвол
ufw enable
```

## Troubleshooting

### Проблема: Контейнеры не запускаются

```bash
# Проверить логи
docker-compose logs

# Пересоздать контейнеры
docker-compose down -v
docker-compose up -d --build
```

### Проблема: База данных не инициализируется

```bash
# Удалить volume базы данных и пересоздать
docker-compose down -v
docker volume rm ritto_postgres_data
docker-compose up -d --build
```

### Проблема: Нет доступа к сайту

```bash
# Проверить, что контейнеры запущены
docker-compose ps

# Проверить, что порт 80 открыт
netstat -tulpn | grep :80

# Проверить nginx логи
docker-compose logs nginx
```

## Мониторинг

### Через Portainer (рекомендуется)

Откройте `http://83.166.246.163:9000` для визуального мониторинга:
- Статус всех контейнеров
- Использование CPU, RAM, диска
- Логи в реальном времени
- Графики потребления ресурсов

### Через командную строку

```bash
# Просмотр использования ресурсов
docker stats

# Проверка дискового пространства
df -h
docker system df

# Логи Portainer
docker-compose logs -f portainer
```

## Backup базы данных

```bash
# Создание backup
docker exec ritto-postgres pg_dump -U ritto_user ritto_db > backup_$(date +%Y%m%d).sql

# Восстановление из backup
cat backup_20250106.sql | docker exec -i ritto-postgres psql -U ritto_user -d ritto_db
```

## SSL (опционально, для будущего использования с доменом)

Когда будет настроен домен, можно добавить SSL через Let's Encrypt:

```bash
# Установка certbot
apt install certbot python3-certbot-nginx -y

# Получение сертификата
certbot certonly --standalone -d sushiritto.com -d www.sushiritto.com

# Обновление nginx.conf для использования SSL
# Раскомментировать секцию SSL в nginx.conf
```

