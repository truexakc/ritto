# Миграции базы данных

Эта директория содержит SQL миграции для базы данных PostgreSQL проекта Ritto.

## Структура миграций

- `001_initial_schema.sql` - Основная схема базы данных (таблицы, индексы, триггеры)
- `002_seed_data.sql` - Тестовые данные для разработки

## Автоматический запуск

При запуске PostgreSQL контейнера через Docker Compose, все `.sql` файлы из этой директории автоматически выполняются в алфавитном порядке.

## Ручной запуск миграций

### Через Docker

```bash
# Запустить все миграции
docker-compose exec postgres psql -U ritto_user -d ritto_db -f /docker-entrypoint-initdb.d/001_initial_schema.sql
docker-compose exec postgres psql -U ritto_user -d ritto_db -f /docker-entrypoint-initdb.d/002_seed_data.sql
```

### Локально (без Docker)

```bash
# Подключение к базе данных
psql -h localhost -U ritto_user -d ritto_db

# Или выполнить файл напрямую
psql -h localhost -U ritto_user -d ritto_db -f migrations/001_initial_schema.sql
psql -h localhost -U ritto_user -d ritto_db -f migrations/002_seed_data.sql
```

## Создание новых миграций

1. Создайте новый файл с префиксом (например, `003_add_new_table.sql`)
2. Напишите SQL код для изменений
3. Убедитесь, что миграция идемпотентна (использует `IF NOT EXISTS`, `ON CONFLICT` и т.д.)
4. Перезапустите контейнер БД или примените миграцию вручную

## Таблицы базы данных

- **users** - Пользователи системы
- **categories** - Категории продуктов
- **products** - Продукты
- **orders** - Заказы
- **order_items** - Элементы заказа
- **cart** - Корзина покупок
- **payments** - Платежи
- **discounts** - Скидки и промокоды
- **reviews** - Отзывы на продукты

## Тестовые данные

После выполнения seed миграции будут созданы:

- 2 тестовых пользователя (admin@ritto.com / user@ritto.com, пароль: admin123)
- 6 категорий продуктов
- ~23 тестовых продукта
- 3 промокода
- 1 тестовый заказ

## Сброс базы данных

```bash
# Остановить и удалить контейнеры
docker-compose down

# Удалить volume с данными
docker volume rm ritto_postgres_data

# Запустить заново (миграции применятся автоматически)
docker-compose up -d
```

