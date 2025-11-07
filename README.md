# 🍕 Ritto - Платформа доставки еды

Современная платформа для заказа и доставки еды с удобным интерфейсом и надежным backend.

## 🚀 Возможности

- 🛒 Корзина покупок с сохранением состояния
- 👤 Аутентификация и авторизация (JWT)
- 💳 Интеграция с Stripe для оплаты
- 📦 Управление заказами
- 🎨 Современный UI на React + TailwindCSS
- 🐳 Docker для простого развертывания
- 🔒 Безопасность (Helmet, XSS protection, HPP)
- 📱 Адаптивный дизайн

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
- [Backend Architecture](./docs/architecture/BACKEND_ARCHITECTURE.md)
- [Migration Guide](./docs/MIGRATION_GUIDE.md) - переход на новую архитектуру
- [Refactoring Summary](./docs/REFACTORING_SUMMARY.md) - что было сделано

### 🔒 Безопасность
- [Security Audit](./docs/SECURITY_AUDIT.md) - полный аудит безопасности
- [Security Improvements](./docs/SECURITY_IMPROVEMENTS.md) - инструкции по улучшению
- [Security Summary](./docs/SECURITY_SUMMARY.md) - краткая сводка

### 🎯 Функциональность
- [Сессии](./docs/features/SESSION_SETUP.md)
- [Корзина](./docs/features/CART_TESTING.md)
- [Загрузка файлов](./docs/features/UPLOADS_SETUP.md)

### 📝 История
- [Changelog](./docs/CHANGELOG.md) - история изменений

## 🛠️ Технологии

### Backend
- **Node.js** + **Express.js** - веб-сервер
- **PostgreSQL** - база данных
- **JWT** - аутентификация
- **Stripe** - платежная система
- **Helmet, XSS-Clean, HPP** - безопасность
- **Docker** - контейнеризация

### Frontend
- **React 18** - UI библиотека
- **Vite** - сборщик
- **TailwindCSS** - стили
- **React Router** - маршрутизация
- **Axios** - HTTP клиент

### DevOps
- **Docker Compose** - оркестрация
- **Nginx** - reverse proxy
- **Adminer** - управление БД
- **Portainer** - управление Docker

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
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
SESSION_SECRET=your_session_secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Client
CLIENT_URL=http://localhost
```

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

# Перезапуск сервиса
docker-compose restart backend
```

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

### Production

1. Настройте environment variables
2. Соберите Docker образы
3. Запустите через docker-compose

```bash
# Сборка для продакшна
docker-compose -f docker-compose.yml build

# Запуск
docker-compose up -d
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
