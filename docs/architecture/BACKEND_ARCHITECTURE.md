# Backend Architecture

## Архитектурный подход

Backend построен на принципах:
- **Domain-Driven Design (DDD)** - разделение по доменам бизнес-логики
- **SOLID** - принципы объектно-ориентированного проектирования
- **KISS** - простота и понятность кода

## Структура проекта

```
back/
├── src/
│   ├── domains/              # Бизнес-домены
│   │   ├── auth/            # Аутентификация
│   │   │   ├── auth.service.js
│   │   │   ├── auth.controller.js
│   │   │   └── auth.routes.js
│   │   ├── product/         # Продукты
│   │   │   ├── product.service.js
│   │   │   ├── product.controller.js
│   │   │   └── product.routes.js
│   │   ├── category/        # Категории
│   │   ├── cart/            # Корзина
│   │   ├── order/           # Заказы
│   │   └── payment/         # Платежи
│   │
│   ├── infrastructure/      # Инфраструктурный слой
│   │   ├── database/        # База данных
│   │   │   └── postgres.js
│   │   ├── middleware/      # Middleware
│   │   │   ├── auth.middleware.js
│   │   │   └── error.middleware.js
│   │   └── config/          # Конфигурация
│   │       ├── cors.config.js
│   │       └── session.config.js
│   │
│   ├── app.js              # Express приложение
│   └── server.js           # HTTP сервер
│
├── migrations/             # Миграции БД
├── public/                 # Статические файлы
└── tests/                  # Тесты

```

## Слои приложения

### 1. Domain Layer (Домены)

Каждый домен содержит:

#### Service (Сервис)
- Бизнес-логика
- Работа с базой данных
- Валидация данных
- Singleton pattern

```javascript
class AuthService {
    async createUser(email, password, fullName) {
        // Бизнес-логика создания пользователя
    }
}

module.exports = new AuthService();
```

#### Controller (Контроллер)
- Обработка HTTP запросов
- Валидация входных данных
- Формирование ответов
- Обработка ошибок

```javascript
class AuthController {
    async register(req, res) {
        // Обработка запроса регистрации
    }
}

module.exports = new AuthController();
```

#### Routes (Маршруты)
- Определение эндпоинтов
- Подключение middleware
- Связь контроллеров с URL

```javascript
router.post('/register', (req, res) => authController.register(req, res));
router.get('/me', protect, (req, res) => authController.getMe(req, res));
```

### 2. Infrastructure Layer (Инфраструктура)

#### Database
- Подключение к PostgreSQL
- Query helper функции
- Connection pooling

#### Middleware
- Аутентификация (JWT)
- Авторизация (роли)
- Обработка ошибок
- Логирование

#### Config
- CORS настройки
- Session настройки
- Environment variables

## Принципы разработки

### SOLID

**S - Single Responsibility**
- Каждый класс отвечает за одну задачу
- Service - бизнес-логика
- Controller - HTTP обработка
- Routes - маршрутизация

**O - Open/Closed**
- Легко расширяется новыми доменами
- Не требует изменения существующего кода

**L - Liskov Substitution**
- Все сервисы следуют единому интерфейсу
- Легко заменяются mock-объектами для тестов

**I - Interface Segregation**
- Минимальные зависимости между модулями
- Четкие границы доменов

**D - Dependency Inversion**
- Зависимость от абстракций (сервисов)
- Не зависим от конкретных реализаций

### KISS (Keep It Simple, Stupid)

- Простая и понятная структура
- Минимум вложенности
- Явные имена функций и переменных
- Один файл = одна ответственность

### DDD (Domain-Driven Design)

- Разделение по бизнес-доменам
- Каждый домен независим
- Четкие границы контекстов
- Ubiquitous Language

## Добавление нового домена

1. Создать папку в `src/domains/`
2. Создать `*.service.js` с бизнес-логикой
3. Создать `*.controller.js` для HTTP обработки
4. Создать `*.routes.js` для маршрутов
5. Подключить routes в `app.js`

Пример:
```bash
src/domains/discount/
├── discount.service.js
├── discount.controller.js
└── discount.routes.js
```

## Миграция старого кода

Старые контроллеры находятся в `back/controllers/` и `back/routes/`.
Постепенно переносятся в новую структуру.

## Тестирование

```bash
# Запуск тестов
npm test

# Тесты с покрытием
npm run test:coverage
```

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

# Client
CLIENT_URL=http://localhost:5173
```

## Best Practices

1. **Всегда используйте try-catch** в контроллерах
2. **Логируйте ошибки** с контекстом
3. **Валидируйте входные данные** на уровне контроллера
4. **Используйте транзакции** для связанных операций
5. **Пишите тесты** для критичной логики
6. **Документируйте API** с примерами запросов
7. **Следуйте code style** проекта
8. **Делайте code review** перед merge

## Полезные команды

```bash
# Разработка
npm run dev

# Продакшн
npm start

# Линтинг
npm run lint

# Форматирование
npm run format
```
