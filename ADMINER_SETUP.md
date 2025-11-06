# Adminer - Управление PostgreSQL

## Что это?
Adminer - легковесный веб-интерфейс для управления базами данных PostgreSQL.

## Запуск

```bash
docker-compose up -d adminer
```

## Доступ

Откройте в браузере: `http://83.166.246.163:8080`

## Данные для входа

- **Система:** PostgreSQL
- **Сервер:** `postgres` (имя контейнера)
- **Пользователь:** значение из `.env` файла `POSTGRES_USER`
- **Пароль:** значение из `.env` файла `POSTGRES_PASSWORD`
- **База данных:** значение из `.env` файла `POSTGRES_DB`

## Возможности

- Просмотр и редактирование таблиц
- Выполнение SQL запросов
- Импорт/экспорт данных
- Управление структурой БД
- Просмотр данных в удобном виде

## Безопасность

⚠️ **Важно:** Adminer доступен на порту 8080. Для продакшена рекомендуется:
1. Ограничить доступ через firewall
2. Использовать VPN
3. Добавить базовую аутентификацию через nginx
4. Или использовать только для разработки

## Альтернатива через nginx (опционально)

Если хотите доступ через основной домен (например, `/adminer`), можно добавить в `nginx.conf`:

```nginx
location /adminer {
    proxy_pass http://adminer:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Тогда доступ будет: `http://83.166.246.163/adminer`

