# Исправление ошибки автоимпорта

## Проблема

При автоматическом импорте из Saby API возникала ошибка:

```
pq: there is no unique or exclusion constraint matching the ON CONFLICT specification (42P10)
```

При этом мануальный импорт работал корректно.

## Причина

В коде персистера (`saby-service/internal/service/db_persister.go`) использовался SQL запрос с конструкцией `ON CONFLICT (external_id)`, но в схеме базы данных для таблицы `categories` поле `external_id` не имело уникального ограничения (UNIQUE constraint).

В исходной миграции `001_initial_schema.sql` был создан только индекс на `external_id`, но не constraint:

```sql
CREATE INDEX IF NOT EXISTS idx_categories_external_id ON categories(external_id);
```

PostgreSQL требует наличия именно UNIQUE constraint для использования `ON CONFLICT`.

## Решение

Создана миграция `003_add_unique_constraints.sql`, которая:

1. Удаляет возможные дубликаты в таблице `categories` по полю `external_id`
2. Добавляет уникальное ограничение на поле `external_id`:

```sql
ALTER TABLE categories 
ADD CONSTRAINT categories_external_id_unique UNIQUE (external_id);
```

## Применение исправления

Миграция была применена командой:

```bash
docker-compose exec -T postgres psql -U ritto_user -d ritto_db < back/migrations/003_add_unique_constraints.sql
```

## Результат

После применения миграции:
- ✅ Автоматический импорт работает корректно
- ✅ Мануальный импорт продолжает работать
- ✅ Нет ошибок в логах saby-service

## Дата исправления

7 февраля 2026
