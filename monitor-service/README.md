# Monitor Service

Легковесный сервис мониторинга Docker контейнеров и health endpoints с отправкой алертов в Telegram.

## Возможности

- Мониторинг статуса Docker контейнеров
- Отслеживание рестартов контейнеров
- Проверка CPU и Memory usage
- Health check HTTP endpoints
- Отправка алертов в Telegram бота

## Настройка

1. Скопируй `.env.example` в `.env`
2. Заполни `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`
3. Настрой список сервисов в `MONITORED_SERVICES`
4. Добавь health endpoints в `HEALTH_ENDPOINTS`

## Запуск

```bash
docker-compose up -d monitor-service
```

## Получение Chat ID

Отправь любое сообщение боту, затем:
```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

Найди `chat.id` в ответе.
