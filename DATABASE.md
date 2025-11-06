# База данных Ritto

## Обзор

Проект использует **PostgreSQL 15** в качестве основной базы данных. База данных запускается в Docker контейнере и автоматически применяет миграции при первом запуске.

## Быстрый старт

### 1. Запуск базы данных через Docker Compose

```bash
# Из корневой директории проекта
docker-compose up -d postgres

# Или запустить все сервисы
docker-compose up -d
```

### 2. Проверка статуса

```bash
# Проверить статус контейнера
docker-compose ps

# Посмотреть логи
docker-compose logs postgres
```

### 3. Подключение к базе данных

```bash
# Через Docker
docker-compose exec postgres psql -U ritto_user -d ritto_db

# Локально (если установлен PostgreSQL клиент)
psql -h localhost -U ritto_user -d ritto_db
```

Пароль: `ritto_password`

## Конфигурация

### Переменные окружения

В файле `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=ritto_user
DB_PASSWORD=ritto_password
DB_NAME=ritto_db
```

### Docker Compose настройки

- **Порт**: 5432 (стандартный PostgreSQL порт)
- **Volume**: `postgres_data` - для сохранения данных между перезапусками
- **Health check**: Автоматическая проверка готовности БД

## Структура базы данных

### Таблицы

1. **users** - Пользователи системы
   - Хранит email, пароль (хешированный), роль, контактные данные
   - Поддерживает роли: user, admin

2. **categories** - Категории продуктов
   - Название, slug, описание, изображение
   - Поддержка активации/деактивации

3. **products** - Продукты
   - Название, описание, цена, скидка
   - Привязка к категории
   - Управление остатками (stock)
   - Поддержка избранных товаров (featured)

4. **orders** - Заказы
   - Информация о заказе, статусы
   - Адрес доставки, контактные данные
   - Связь с пользователем и скидками

5. **order_items** - Элементы заказа
   - Товары в заказе с ценами и количеством
   - Связь с orders и products

6. **cart** - Корзина покупок
   - Товары в корзине пользователя
   - Уникальная пара user_id + product_id

7. **payments** - Платежи
   - Интеграция со Stripe
   - Статусы платежей, метаданные

8. **discounts** - Скидки и промокоды
   - Процентные и фиксированные скидки
   - Ограничения по сумме заказа
   - Срок действия

9. **reviews** - Отзывы
   - Рейтинг (1-5), комментарий
   - Привязка к продукту и пользователю

### Индексы

Для оптимизации производительности созданы индексы на:
- Email пользователей
- Slug продуктов и категорий
- Внешние ключи (foreign keys)
- Часто используемые поля фильтрации

### Триггеры

Автоматическое обновление поля `updated_at` для всех таблиц при изменении записей.

## Миграции

### Структура миграций

```
back/migrations/
├── 001_initial_schema.sql  # Основная схема БД
├── 002_seed_data.sql       # Тестовые данные
└── README.md               # Документация
```

### Автоматическое применение

При первом запуске PostgreSQL контейнера все `.sql` файлы из директории `migrations/` выполняются автоматически в алфавитном порядке.

### Ручное применение миграций

```bash
# Через Docker
docker-compose exec postgres psql -U ritto_user -d ritto_db -f /docker-entrypoint-initdb.d/001_initial_schema.sql

# Локально
psql -h localhost -U ritto_user -d ritto_db -f back/migrations/001_initial_schema.sql
```

## Скрипт управления БД

Используйте скрипт `back/scripts/db-setup.sh` для управления базой данных:

```bash
# Запуск БД
./back/scripts/db-setup.sh start

# Остановка БД
./back/scripts/db-setup.sh stop

# Полный сброс БД (удаляет все данные!)
./back/scripts/db-setup.sh reset

# Применить миграции
./back/scripts/db-setup.sh migrate

# Подключиться к БД
./back/scripts/db-setup.sh connect

# Создать резервную копию
./back/scripts/db-setup.sh backup

# Восстановить из резервной копии
./back/scripts/db-setup.sh restore backup_file.sql

# Просмотр логов
./back/scripts/db-setup.sh logs
```

## Тестовые данные

После применения seed миграции (`002_seed_data.sql`) будут созданы:

### Пользователи

- **Admin**: `admin@ritto.com` / `admin123`
- **User**: `user@ritto.com` / `admin123`

### Данные

- 6 категорий продуктов
- ~23 тестовых продукта
- 3 промокода (WELCOME10, SAVE20, SUMMER15)
- 1 тестовый заказ

## Резервное копирование

### Создание резервной копии

```bash
# Через скрипт
./back/scripts/db-setup.sh backup

# Или напрямую
docker-compose exec -T postgres pg_dump -U ritto_user ritto_db > backup.sql
```

### Восстановление

```bash
# Через скрипт
./back/scripts/db-setup.sh restore backup.sql

# Или напрямую
docker-compose exec -T postgres psql -U ritto_user -d ritto_db < backup.sql
```

## Подключение из приложения

### Node.js с pg модулем

```javascript
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});
```

Пример уже реализован в `back/config/postgres.js`

## Troubleshooting

### Контейнер не запускается

```bash
# Проверить логи
docker-compose logs postgres

# Убедиться, что порт 5432 свободен
lsof -i :5432
```

### Миграции не применились

```bash
# Применить миграции вручную
./back/scripts/db-setup.sh migrate
```

### Ошибка подключения из приложения

Проверьте:
1. Запущен ли контейнер PostgreSQL
2. Правильность переменных окружения в `.env`
3. Если используете Docker, убедитесь что бэкенд в той же сети

### Сброс базы данных

```bash
# Полный сброс (удалит все данные!)
./back/scripts/db-setup.sh reset

# Или вручную
docker-compose down
docker volume rm ritto_postgres_data
docker-compose up -d postgres
```

## Production рекомендации

1. **Измените пароли** - используйте сильные пароли в production
2. **Регулярное резервное копирование** - настройте автоматические бэкапы
3. **Мониторинг** - используйте инструменты мониторинга PostgreSQL
4. **Масштабирование** - рассмотрите использование managed PostgreSQL (AWS RDS, DigitalOcean, Supabase)
5. **SSL соединения** - включите SSL для production
6. **Connection pooling** - настройте оптимальный размер пула подключений

## Полезные команды

```bash
# Список таблиц
\dt

# Описание таблицы
\d table_name

# Список баз данных
\l

# Переключиться на другую БД
\c database_name

# Выход из psql
\q

# Выполнить SQL из файла
\i /path/to/file.sql
```

## Дополнительные ресурсы

- [PostgreSQL документация](https://www.postgresql.org/docs/)
- [Docker PostgreSQL образ](https://hub.docker.com/_/postgres)
- [pg (node-postgres) документация](https://node-postgres.com/)

