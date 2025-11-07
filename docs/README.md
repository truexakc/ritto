# Документация проекта Ritto

## Навигация по документации

### 🚀 Быстрый старт
- [Quick Start Guide](./guides/QUICK_START.md) - начало работы за 5 минут
- [Contributing Guide](./guides/CONTRIBUTING.md) - как внести вклад в проект

### ⚙️ Настройка и развертывание
- [Настройка базы данных](./setup/DATABASE.md)
- [Настройка Nginx](./setup/NGINX_FIX.md)
- [Отладка Nginx](./setup/DEBUG_NGINX.md)
- [Развертывание](./setup/DEPLOY.md)

### 🏗️ Архитектура
- [Архитектура Backend](./architecture/BACKEND_ARCHITECTURE.md) - DDD, SOLID, KISS
- [Migration Guide](./MIGRATION_GUIDE.md) - переход на новую архитектуру
- [Refactoring Summary](./REFACTORING_SUMMARY.md) - что было сделано

### 🔒 Безопасность
- [Security Audit](./SECURITY_AUDIT.md) - полный аудит безопасности (8/10)
- [Security Improvements](./SECURITY_IMPROVEMENTS.md) - пошаговые инструкции
- [Security Summary](./SECURITY_SUMMARY.md) - краткая сводка

### 🎯 Функциональность
- [Настройка сессий](./features/SESSION_SETUP.md)
- [Настройка Adminer](./features/ADMINER_SETUP.md)
- [Тестирование корзины](./features/CART_TESTING.md)
- [Настройка загрузки файлов](./features/UPLOADS_SETUP.md)

### 📝 История и изменения
- [Changelog](./CHANGELOG.md) - история изменений проекта

---

## Быстрый старт

### Локальная разработка

```bash
# Backend
cd back
npm install
npm run dev

# Frontend
cd front
npm install
npm run dev
```

### Docker

```bash
# Сборка и запуск всех сервисов
docker-compose up -d

# Пересборка
docker-compose build

# Остановка
docker-compose down
```

## Структура проекта

```
ritto/
├── back/           # Backend (Node.js + Express)
│   ├── src/       # Новая архитектура (DDD)
│   └── ...
├── front/          # Frontend (React + Vite)
├── testAdmin/      # Админ панель
├── docs/           # Документация
│   ├── guides/    # Руководства
│   ├── setup/     # Настройка
│   ├── features/  # Функциональность
│   └── architecture/ # Архитектура
├── tests/          # Тесты
│   └── manual/    # Ручные тесты
└── docker-compose.yml
```

## Технологии

### Backend
- Node.js + Express
- PostgreSQL
- JWT Authentication
- Stripe Payment
- Docker
- DDD Architecture

### Frontend
- React 18
- Vite
- TailwindCSS
- React Router
- Axios

## Тестирование

### Backend тесты
```bash
cd back
npm test
```

### Ручные тесты
- [Тест корзины](../tests/manual/test-browser-cart.html)
- [Тест Nginx](../tests/manual/nginx-test.sh)

## Контакты и поддержка

Для вопросов и предложений создавайте issue в репозитории.

---

Made with ❤️ for food delivery
