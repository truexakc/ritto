# Ritto Backend

Backend API для платформы доставки еды Ritto.

## Технологии

- **Node.js** 18+
- **Express.js** - веб-фреймворк
- **PostgreSQL** - база данных
- **JWT** - аутентификация
- **Stripe** - платежи
- **Docker** - контейнеризация

## Быстрый старт

### Локальная разработка

```bash
# Установка зависимостей
npm install

# Копирование .env
cp .env.example .env

# Запуск в режиме разработки
npm run dev
```

### Docker

```bash
# Сборка и запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f backend

# Остановка
docker-compose down
```

## Структура проекта

```
back/
├── src/                    # Новая архитектура (DDD)
│   ├── domains/           # Бизнес-домены
│   ├── infrastructure/    # Инфраструктура
│   ├── app.js            # Express приложение
│   └── server.js         # HTTP сервер
│
├── controllers/           # Старые контроллеры (legacy)
├── routes/               # Старые маршруты (legacy)
├── middleware/           # Middleware
├── config/               # Конфигурация
├── migrations/           # SQL миграции
└── public/               # Статические файлы
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход
- `POST /api/auth/refresh` - Обновление токена
- `GET /api/auth/me` - Текущий пользователь

### Products
- `GET /api/products` - Список продуктов
- `GET /api/products/popular` - Популярные продукты
- `GET /api/products/categories` - Категории
- `POST /api/products` - Создать продукт (admin)
- `PUT /api/products/:id` - Обновить продукт (admin)
- `DELETE /api/products/:id` - Удалить продукт (admin)

### Cart
- `GET /api/cart` - Получить корзину
- `POST /api/cart` - Добавить в корзину
- `PUT /api/cart/:id` - Обновить количество
- `DELETE /api/cart/:id` - Удалить из корзины

### Orders
- `GET /api/orders` - Список заказов
- `POST /api/orders` - Создать заказ
- `GET /api/orders/:id` - Детали заказа
- `PUT /api/orders/:id` - Обновить статус (admin)

### Payment
- `POST /api/payment/create-intent` - Создать платеж
- `POST /api/payment/webhook` - Webhook от Stripe

## Environment Variables

```env
# Server
PORT=5001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=ritto_db

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Session
SESSION_SECRET=your-session-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Client
CLIENT_URL=http://localhost:5173
```

## Разработка

### Запуск тестов

```bash
npm test
```

### Миграции БД

```bash
# Применить миграции
psql -U postgres -d ritto_db -f migrations/001_initial_schema.sql
psql -U postgres -d ritto_db -f migrations/002_seed_data.sql
```

### Линтинг

```bash
npm run lint
```

## Архитектура

Проект следует принципам:
- **DDD** (Domain-Driven Design)
- **SOLID**
- **KISS** (Keep It Simple, Stupid)

Подробнее: [Backend Architecture](../docs/architecture/BACKEND_ARCHITECTURE.md)

## Миграция на новую архитектуру

Старый код находится в:
- `controllers/` → переносится в `src/domains/*/controller.js`
- `routes/` → переносится в `src/domains/*/routes.js`

Новые домены создаются сразу в `src/domains/`.

## Troubleshooting

### Ошибка подключения к БД

```bash
# Проверить статус PostgreSQL
docker-compose ps postgres

# Проверить логи
docker-compose logs postgres
```

### Ошибка CORS

Убедитесь, что `CLIENT_URL` в `.env` соответствует адресу фронтенда.

### Ошибка JWT

Проверьте, что `JWT_SECRET` установлен в `.env`.

## Полезные ссылки

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Stripe API](https://stripe.com/docs/api)
- [JWT.io](https://jwt.io/)

## Лицензия

MIT
