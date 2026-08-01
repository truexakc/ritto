# UptimeRobot Setup - Быстрый старт

## Почему UptimeRobot?

- ✅ **Бесплатно:** 50 мониторов на free плане
- ✅ **Без нагрузки:** Не использует ресурсы вашего VPS
- ✅ **Надежно:** Проверки из разных локаций
- ✅ **Просто:** Настройка за 5 минут
- ✅ **Алерты:** Email, SMS, Slack, Webhook, Telegram

---

## 🚀 Быстрая настройка (5 минут)

### Шаг 1: Регистрация

1. Перейдите на https://uptimerobot.com
2. Нажмите **Sign Up Free**
3. Введите email и пароль
4. Подтвердите email

---

### Шаг 2: Создание мониторов

#### Монитор 1: Backend API Status (детальный)

1. Нажмите **+ Add New Monitor**
2. Заполните:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Ritto Backend (Detailed)
   - **URL:** `https://sushiritto.ru/api/status`
   - **Monitoring Interval:** 5 minutes
   - **Monitor Timeout:** 30 seconds
3. В разделе **Advanced Settings → Keyword Check:**
   - **Keyword Type:** Keyword Exists
   - **Keyword:** `"status":"healthy"`
   - **Keyword Case Sensitivity:** Case-Insensitive
4. Нажмите **Create Monitor**

#### Монитор 2: Backend Ping (быстрый)

1. **+ Add New Monitor**
2. Заполните:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Ritto Backend (Ping)
   - **URL:** `https://sushiritto.ru/ping`
   - **Monitoring Interval:** 5 minutes
   - **Monitor Timeout:** 10 seconds
3. **Keyword Check:**
   - **Keyword:** `pong`
4. **Create Monitor**

#### Монитор 3: Frontend

1. **+ Add New Monitor**
2. Заполните:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Ritto Frontend
   - **URL:** `https://sushiritto.ru`
   - **Monitoring Interval:** 5 minutes
   - **Monitor Timeout:** 30 seconds
3. **Keyword Check (опционально):**
   - Проверьте наличие ключевого слова на главной странице
4. **Create Monitor**

#### Монитор 4: SSL Certificate

1. **+ Add New Monitor**
2. Заполните:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Ritto SSL Certificate
   - **URL:** `https://sushiritto.ru`
   - **Monitoring Interval:** 1 day
3. В **Advanced Settings:**
   - Включите **SSL Certificate Expiration** (алерт за 7 дней до истечения)
4. **Create Monitor**

---

### Шаг 3: Настройка алертов

#### Email алерты (включены по умолчанию)

Алерты на ваш email уже настроены автоматически.

#### Telegram алерты (рекомендуем)

1. Создайте бота через [@BotFather](https://t.me/botfather)
2. Получите токен бота
3. Найдите бота [@UptimeRobot_bot](https://t.me/UptimeRobot_bot)
4. Отправьте `/start`
5. Следуйте инструкциям для привязки

**Альтернатива через Webhook:**

1. В UptimeRobot: **My Settings → Alert Contacts**
2. **Add Alert Contact**
3. Выберите **Webhook**
4. URL: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage`
5. Method: **POST**
6. Body:
```json
{
  "chat_id": "YOUR_CHAT_ID",
  "text": "*monitorFriendlyName* is *alertTypeFriendlyName*\n\nURL: *monitorURL*\nReason: *alertDetails*",
  "parse_mode": "Markdown"
}
```

#### Slack алерты

1. **My Settings → Alert Contacts**
2. **Add Alert Contact → Slack**
3. Авторизуйтесь в Slack
4. Выберите канал

---

### Шаг 4: Создание Public Status Page

1. Перейдите в **Status Pages**
2. Нажмите **+ Add Status Page**
3. Настройте:
   - **Status Page Name:** Ritto Status
   - **Custom URL:** `https://stats.uptimerobot.com/ваш-id`
   - **Custom Domain:** (опционально, если хотите свой домен)
4. Добавьте мониторы, которые хотите показывать публично
5. Настройте дизайн
6. **Create Status Page**

**Пример Public Status Page:**
```
https://stats.uptimerobot.com/xxxxx
```

Этой ссылкой можно поделиться с клиентами или добавить на сайт.

---

## 📊 Рекомендуемая конфигурация мониторов

| Монитор | URL | Интервал | Keyword | Назначение |
|---------|-----|----------|---------|------------|
| Backend (Detailed) | `/api/status` | 5 min | `"status":"healthy"` | Полная проверка здоровья |
| Backend (Ping) | `/ping` | 5 min | `pong` | Быстрая проверка доступности |
| Frontend | `/` | 5 min | - | Проверка главной страницы |
| Database Check | `/api/status` | 5 min | `"database":{"status":"healthy"` | Проверка БД |
| SSL Certificate | `/` | 1 day | - | Срок действия SSL |

---

## 🔔 Настройка алертов

### Рекомендуемые настройки

1. **Alert When:**
   - Down (обязательно)
   - SSL expires in 7 days (рекомендуется)

2. **Re-Notification:**
   - Enable (чтобы напоминало, если проблема не решена)
   - Interval: 30 minutes

3. **Alert Contacts:**
   - Email (всегда)
   - Telegram (для мгновенных уведомлений)
   - SMS (для критичных сервисов, платно после лимита)

---

## 📈 Что мониторить

### Обязательные проверки

- ✅ Backend API (`/api/status` + keyword check)
- ✅ Frontend доступность
- ✅ SSL сертификат (срок действия)

### Дополнительные проверки

- Database health (через `/api/status` + keyword `"database":{"status":"healthy"`)
- Response time alerts (если > 5 секунд)
- Specific API endpoints (`/api/vk/auth`, `/api/cart`)

---

## 🎨 Интеграция Status Page на ваш сайт

### Вариант 1: Badge/Widget

UptimeRobot предоставляет виджет для встраивания:

```html
<!-- Status Badge -->
<a href="https://stats.uptimerobot.com/xxxxx">
  <img src="https://img.shields.io/uptimerobot/status/m123456789-xxxxx?label=API%20Status" alt="API Status">
</a>
```

### Вариант 2: JavaScript Widget

```html
<script src="https://uptimerobot.com/inc/widget/widget.js"></script>
<script>
  UR.Widget({
    apiKey: "ur123456-xxxxx",
    monitors: "123456-789012"
  });
</script>
```

### Вариант 3: iFrame

```html
<iframe 
  src="https://stats.uptimerobot.com/xxxxx" 
  width="100%" 
  height="600" 
  frameborder="0">
</iframe>
```

---

## 🔗 API Integration

UptimeRobot предоставляет API для получения данных мониторинга.

### Получить статус всех мониторов

```bash
curl -X POST https://api.uptimerobot.com/v2/getMonitors \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "YOUR_API_KEY",
    "format": "json"
  }'
```

### API Key

Получить в **My Settings → API Settings**

---

## 💡 Pro Tips

### 1. Используйте Keyword Checks

Вместо простой проверки HTTP 200, проверяйте ключевые слова:
- `/api/status` должен содержать `"status":"healthy"`
- `/ping` должен содержать `pong`

Это защитит от ситуации, когда сервер отвечает 200, но с ошибкой.

### 2. Создайте maintenance windows

Перед деплоем:
1. **My Settings → Maintenance Windows**
2. **Add Maintenance Window**
3. Выберите мониторы
4. Установите время
5. Алерты не будут приходить во время обслуживания

### 3. Настройте правильные интервалы

- **Critical services:** 5 minutes
- **Regular checks:** 10-15 minutes
- **SSL certificates:** 1 day
- **Status pages:** 1 hour

### 4. Группируйте мониторы

Создайте группы для удобства:
- Production Services
- Development Services
- Infrastructure (SSL, DNS)

---

## 📊 Альтернативы на Free плане

| Сервис | Мониторов | Интервал | Особенности |
|--------|-----------|----------|-------------|
| **UptimeRobot** | 50 | 5 min | Лучший выбор, много функций |
| **Freshping** | 50 | 1 min | Быстрее, проверки из 10 локаций |
| **Better Uptime** | 10 | 3 min | Telephone alerts, красивый UI |
| **StatusCake** | 10 | 5 min | UK-based |
| **Pingdom** | 1 | 1 min | Только 1 монитор |

---

## ✅ Checklist после настройки

- [ ] Создано минимум 3 монитора (Backend, Frontend, SSL)
- [ ] Настроены email алерты
- [ ] Настроены Telegram/Slack алерты
- [ ] Создана Public Status Page
- [ ] Проверена работа алертов (Test button)
- [ ] Добавлены keyword checks для `/api/status`
- [ ] Настроен maintenance window для деплоя

---

## 🆘 Troubleshooting

### Алерты не приходят

1. Проверьте email в spam
2. Убедитесь, что Alert Contact включен для монитора
3. Проверьте **My Settings → Alert Contacts** (должны быть активны)

### False positives

1. Увеличьте timeout до 30-60 секунд
2. Включите **Re-check after down** (автоматическая перепроверка)
3. Проверьте, не блокирует ли firewall IP UptimeRobot

### Status Page не обновляется

1. Убедитесь, что мониторы добавлены на Status Page
2. Проверьте, что Status Page не в Maintenance Mode
3. Очистите кеш браузера

---

## 📚 Полезные ссылки

- [UptimeRobot Documentation](https://uptimerobot.com/api/)
- [Status Page Examples](https://stats.uptimerobot.com/)
- [Telegram Bot Setup](https://t.me/UptimeRobot_bot)

