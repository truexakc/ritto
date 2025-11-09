# Интеграция с Telegram Bot

## Быстрый старт

### Шаг 1: Создайте бота
1. Откройте [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте `/newbot` и следуйте инструкциям
3. Сохраните токен бота

### Шаг 2: Получите Chat ID
1. Найдите [@userinfobot](https://t.me/userinfobot)
2. Отправьте ему сообщение
3. Скопируйте ваш Chat ID

### Шаг 3: Настройте .env
Добавьте в `back/.env`:
```env
TELEGRAM_BOT_TOKEN=ваш_токен_бота
TELEGRAM_CHAT_ID=ваш_chat_id

# Или несколько получателей через запятую:
TELEGRAM_CHAT_ID=123456789,987654321,555666777
```

### Шаг 4: Используйте API
```javascript
// POST /api/telegram/order - создать заказ с уведомлением
// POST /api/telegram/test - тестовое сообщение (только админ)
```

## Изменение на фронтенде

В `front/src/pages/Checkout.tsx` измените:
```typescript
// Было:
const response = await axiosInstance.post("/orders", orderData);

// Стало:
const response = await axiosInstance.post("/telegram/order", orderData);
```

Подробная документация: `back/README_TELEGRAM.md`
