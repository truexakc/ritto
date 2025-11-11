# 🍕 Ritto - Платформа доставки еды

Современная платформа для заказа и доставки еды с удобным интерфейсом и надежным backend.

## 🚀 Возможности

- 🛒 Корзина покупок с сохранением состояния (сессии + БД)
- 👤 Аутентификация и авторизация (JWT + HttpOnly cookies)
- 💳 Интеграция с платежными системами
- 📦 Управление заказами с отслеживанием статусов
- 📱 Telegram Bot интеграция для уведомлений о заказах
- 🎨 Современный UI на React + TailwindCSS
- � Doзcker для простого развертывания
- � Безотпасность (Helmet, XSS protection, HPP, Rate Limiting)
- 📱 Адаптивный дизайн
- 🔄 Интеграция с SBIS API для импорта товаров

## 📋 Требования

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (опционально)
- npm или yarn

## 🏗️ Структура проекта

```
ritto/
├── back/           # Backend API (Node.js + Express)
├── front/          # Frontend (React + Vite)
├── testAdmin/      # Админ панель
├── docs/           # Документация
│   ├── setup/      # Инструкции по настройке
│   ├── features/   # Описание функций
│   └── architecture/ # Архитектура
└── docker-compose.yml
```

## 🚀 Быстрый старт

### Вариант 1: Docker (рекомендуется)

```bash
# Клонировать репозиторий
git clone <repository-url>
cd ritto

# Создать .env файл
cp .env.example .env

# Запустить все сервисы
docker-compose up -d

# Проверить статус
docker-compose ps
```

Приложение будет доступно:
- Frontend: http://localhost
- Backend API: http://localhost:5001
- Adminer (БД): http://localhost:8080
- Portainer: http://localhost:9000

### Вариант 2: Локальная разработка

#### Backend

```bash
cd back
npm install
cp .env.example .env
npm run dev
```

#### Frontend

```bash
cd front
npm install
npm run dev
```

## 📚 Документация

### 🚀 Быстрый старт
- [Quick Start Guide](./docs/guides/QUICK_START.md) - начало работы за 5 минут
- [Contributing Guide](./docs/guides/CONTRIBUTING.md) - как внести вклад

### ⚙️ Настройка
- [База данных](./docs/setup/DATABASE.md)
- [Nginx](./docs/setup/NGINX_FIX.md)
- [Развертывание](./docs/setup/DEPLOY.md)

### 🏗️ Архитектура
- [Backend Architecture](./docs/architecture/BACKEND_ARCHITECTURE.md) - DDD, SOLID, KISS
- [Migration Guide](./docs/MIGRATION_GUIDE.md) - переход на новую архитектуру
- [Refactoring Summary](./docs/REFACTORING_SUMMARY.md) - что было сделано

### 🔒 Безопасность
- [Security Audit](./docs/SECURITY_AUDIT.md) - полный аудит безопасности (8/10)
- [Security Improvements](./docs/SECURITY_IMPROVEMENTS.md) - инструкции по улучшению
- [Security Summary](./docs/SECURITY_SUMMARY.md) - краткая сводка

### 🎯 Функциональность
- [Telegram Integration](./docs/TELEGRAM_INTEGRATION.md) - интеграция с Telegram Bot
- [Сессии](./docs/features/SESSION_SETUP.md)
- [Корзина](./docs/features/CART_TESTING.md)
- [Загрузка файлов](./docs/features/UPLOADS_SETUP.md)

### 📝 История
- [Changelog](./docs/CHANGELOG.md) - история изменений
- [Production Ready](./docs/PRODUCTION_READY.md) - подготовка к продакшену

## 🛠️ Технологии

### Backend
- **Node.js 18+** + **Express.js** - веб-сервер
- **PostgreSQL 15+** - база данных
- **JWT** - аутентификация с HttpOnly cookies
- **Express Session** - управление сессиями
- **Telegram Bot API** - уведомления о заказах
- **Helmet, XSS-Clean, HPP** - безопасность
- **Rate Limiting** - защита от DDoS
- **Docker** - контейнеризация

### Frontend
- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Vite** - сборщик
- **TailwindCSS** - стили
- **React Router** - маршрутизация
- **Redux Toolkit** - управление состоянием
- **Axios** - HTTP клиент

### DevOps
- **Docker Compose** - оркестрация
- **Nginx** - reverse proxy
- **Adminer** - управление БД
- **Portainer** - управление Docker

### Интеграции
- **SBIS API** - импорт товаров
- **Telegram Bot** - уведомления
- **Stripe** (опционально) - платежи

## 🔧 Конфигурация

### Environment Variables

Создайте `.env` файл в корне проекта:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=ritto_db

# Backend
PORT=5001
NODE_ENV=production
DEBUG=false  # Установите 'true' для включения логов в продакшене

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
SESSION_SECRET=your_session_secret

# Stripe (опционально)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Telegram Bot (опционально)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id  # Можно несколько через запятую

# SBIS API (опционально)
SBIS_LOGIN=your_login
SBIS_PASSWORD=your_password
SBIS_POINT_ID=your_point_id
SBIS_PRICE_LIST_ID=your_price_list_id

# Client
CLIENT_URL=http://localhost
```

**⚠️ Важно для продакшена:**
- Измените все секреты на уникальные значения
- Установите `NODE_ENV=production`
- Установите `DEBUG=false` для отключения логов
- Используйте сильные пароли для БД

## 📦 Основные команды

### Docker

```bash
# Запуск всех сервисов
docker-compose up -d

# Остановка
docker-compose down

# Пересборка
docker-compose build

# Просмотр логов
docker-compose logs -f

# Просмотр логов конкретного сервиса
docker-compose logs -f backend

# Перезапуск сервиса
docker-compose restart backend
```

### Логирование

Проект использует условное логирование для безопасности и производительности:

**Backend:**
- В режиме `development` или `test` - все логи выводятся
- В режиме `production` - логи отключены (кроме ошибок)
- Для включения логов в продакшене: `DEBUG=true` в `.env`

**Frontend:**
- В режиме разработки Vite - все логи выводятся
- В продакшене - логи отключены
- Для включения логов в продакшене: `VITE_DEBUG=true` в `.env`

```bash
# Backend - включить логи в продакшене
echo "DEBUG=true" >> back/.env
docker-compose restart backend

# Frontend - включить логи в продакшене
echo "VITE_DEBUG=true" >> front/.env
# Пересобрать фронтенд
```

**⚠️ Важно:** Не забудьте отключить DEBUG режим после отладки!

Подробнее: [Production Ready Guide](./docs/PRODUCTION_READY.md)

### Backend

```bash
cd back

# Разработка
npm run dev

# Продакшн
npm start

# Тесты
npm test
```

### Frontend

```bash
cd front

# Разработка
npm run dev

# Сборка
npm run build

# Preview
npm run preview
```

## 🏗️ Архитектура Backend

Backend построен на принципах **DDD** (Domain-Driven Design), **SOLID** и **KISS**:

```
back/src/
├── domains/              # Бизнес-домены
│   ├── auth/            # Аутентификация
│   ├── product/         # Продукты
│   ├── cart/            # Корзина
│   ├── order/           # Заказы
│   └── payment/         # Платежи
│
├── infrastructure/      # Инфраструктура
│   ├── database/        # БД
│   ├── middleware/      # Middleware
│   └── config/          # Конфигурация
│
├── app.js              # Express приложение
└── server.js           # HTTP сервер
```

Подробнее: [Backend Architecture](./docs/architecture/BACKEND_ARCHITECTURE.md)

## 🧪 Тестирование

```bash
# Backend тесты
cd back
npm test

# Frontend тесты
cd front
npm test
```

## 🚀 Развертывание

### Production Checklist

Перед запуском на продакшене:

1. ✅ Измените все секреты в `.env` на уникальные
2. ✅ Установите `NODE_ENV=production`
3. ✅ Установите `DEBUG=false` (логи будут отключены)
4. ✅ Настройте сильные пароли для БД
5. ✅ Настройте Telegram Bot (опционально)
6. ✅ Проверьте CORS настройки
7. ✅ Настройте SSL сертификаты для HTTPS

### Запуск

```bash
# Сборка для продакшна
docker-compose -f docker-compose.yml build

# Запуск
docker-compose up -d

# Проверка логов
docker-compose logs -f backend
```

### Режим отладки

Если нужно включить логи в продакшене для отладки:

```env
DEBUG=true
```

Подробнее: [Deployment Guide](./docs/setup/DEPLOY.md)

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📝 Лицензия

MIT License

## 👥 Авторы

- Backend Architecture - Domain-Driven Design
- Frontend - React + TailwindCSS
- DevOps - Docker + Nginx

## 📞 Поддержка

Для вопросов и предложений создавайте issue в репозитории.

---

Made with ❤️ for food delivery
