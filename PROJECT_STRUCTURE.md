# 📁 Структура проекта Ritto

Полное описание структуры файлов и папок проекта.

---

## 📊 Корневая структура

```
ritto/
├── 📄 README.md                      # Главная документация проекта
├── 📄 PROJECT_STRUCTURE.md           # Этот файл
├── 📄 docker-compose.yml             # Docker orchestration
├── 📄 nginx.conf                     # Конфигурация Nginx (production с SSL)
├── 📄 nginx-http-only.conf           # Конфигурация Nginx (HTTP only, для теста)
├── 📄 generate-vk-signature.js       # Утилита для генерации VK подписей
│
├── 📁 back/                          # Backend (Node.js + Express)
├── 📁 front/                         # Frontend (React + Vite)
├── 📁 testAdmin/                     # Admin панель
├── 📁 vk-mini-app/                   # VK Mini App (React)
├── 📁 saby-service/                  # Go микросервис (SBIS интеграция)
├── 📁 scripts/                       # Shell скрипты (деплой, проверки)
├── 📁 docs/                          # Документация
├── 📁 tests/                         # Тесты
├── 📁 certbot/                       # SSL сертификаты Let's Encrypt
│
├── 🔒 .env                           # Environment variables (не в git)
├── 📄 .env.example                   # Пример .env
├── 📄 .gitignore                     # Git ignore правила
└── 📁 .temp/                         # Временные файлы (не в git)
```

---

## 🔧 Backend (`back/`)

```
back/
├── 📄 server.js                      # Главный файл сервера
├── 📄 package.json                   # NPM dependencies
├── 📄 package-lock.json              # NPM lock file
├── 📄 Dockerfile                     # Docker образ для backend
├── 📄 .dockerignore                  # Docker ignore правила
├── 📄 .env                           # Backend environment variables
├── 📄 .env.example                   # Пример backend .env
├── 📄 README.md                      # Backend документация
│
├── 📁 config/                        # Конфигурация
│   ├── db.js                         # Database config (legacy)
│   └── postgres.js                   # PostgreSQL connection pool
│
├── 📁 controllers/                   # Route контроллеры
│   ├── adminController.js            # Admin endpoints
│   ├── authController.js             # Authentication
│   ├── cartController.js             # Shopping cart
│   ├── discountController.js         # Discounts/promos
│   ├── manualController.js           # Manual operations
│   ├── orderController.js            # Orders
│   └── paymentController.js          # Payments (Stripe)
│
├── 📁 routes/                        # API маршруты
│   ├── adminRoutes.js                # /api/admin
│   ├── authRoutes.js                 # /api/auth
│   ├── cartRoutes.js                 # /api/cart
│   ├── discountRoutes.js             # /api/discounts
│   ├── manualRoutes.js               # /api/manual
│   ├── paymentRoutes.js              # /api/payment
│   └── vk.js                         # /api/vk (VK Mini App)
│
├── 📁 middleware/                    # Express middleware
│   ├── authMiddleware.js             # JWT authentication
│   ├── errorHandler.js               # Error handling
│   ├── errorMiddleware.js            # Error middleware (legacy)
│   ├── rateLimitMiddleware.js        # Rate limiting
│   └── vkAuthMiddleware.js           # VK Launch Params validation
│
├── 📁 services/                      # Business logic services
│   ├── orderValidation.js            # Order validation
│   └── sabyIntegration.js            # SBIS/Saby integration client
│
├── 📁 utils/                         # Утилиты
│   └── logger.js                     # Logging utility
│
├── 📁 migrations/                    # SQL миграции
│   ├── 001_initial_schema.sql        # Initial DB schema
│   ├── 002_seed_data.sql             # Seed data
│   ├── 002_session_table.sql         # Session table
│   ├── 003_add_unique_constraints.sql
│   ├── 004_vk_orders_schema.sql      # VK orders tables
│   ├── 005_refactor_orders_schema.sql
│   └── README.md                     # Migration instructions
│
└── 📁 public/uploads/                # Uploaded files (product images)
    └── products/                     # Product images (183 files)
```

---

## 🎨 Frontend (`front/`)

```
front/
├── 📄 package.json                   # NPM dependencies
├── 📄 vite.config.ts                 # Vite configuration
├── 📄 tsconfig.json                  # TypeScript config
├── 📄 Dockerfile                     # Docker образ для frontend
├── 📄 .dockerignore
├── 📄 .env                           # Frontend environment variables
├── 📄 .env.example
│
├── 📁 src/                           # Source code
│   ├── App.tsx                       # Main App component
│   ├── main.tsx                      # Entry point
│   ├── index.css                     # Global styles
│   │
│   ├── 📁 pages/                     # React pages
│   ├── 📁 components/                # React components
│   ├── 📁 hooks/                     # Custom React hooks
│   ├── 📁 store/                     # Redux store
│   ├── 📁 services/                  # API services
│   ├── 📁 utils/                     # Utilities
│   └── 📁 types/                     # TypeScript types
│
└── 📁 public/                        # Static assets
```

---

## 🔧 SBIS Service (`saby-service/`)

Go микросервис для интеграции с SBIS API.

```
saby-service/
├── 📄 go.mod                         # Go modules
├── 📄 go.sum                         # Go dependencies lock
├── 📄 Dockerfile                     # Docker образ
├── 📄 .env                           # Environment variables
├── 📄 .env.example
├── 📄 README.md
│
├── 📁 cmd/app/                       # Application entry point
│   └── main.go
│
├── 📁 internal/                      # Internal packages
│   ├── 📁 api/                       # HTTP API handlers
│   ├── 📁 config/                    # Configuration
│   ├── 📁 database/                  # Database layer
│   ├── 📁 models/                    # Data models
│   └── 📁 sbis/                      # SBIS API client
│
└── 📁 migrations/                    # Database migrations
```

---

## 📜 Scripts (`scripts/`)

Все утилитарные shell скрипты.

```
scripts/
├── 📄 README.md                      # Документация скриптов
│
├── 📊 Мониторинг и проверки
│   ├── check-status.sh               # Проверка статуса backend (/ping, /health, /api/status)
│   └── check-resources.sh            # Проверка ресурсов сервера (RAM, CPU, Disk)
│
├── 🚀 Деплой и обновления
│   ├── safe-deploy.sh                # Безопасный полный деплой
│   ├── quick-update.sh               # Быстрое обновление сервиса
│   ├── rollback.sh                   # Откат последнего деплоя
│   └── rebuild-go-services.sh        # Пересборка Go сервисов
│
├── 🔐 SSL сертификаты
│   ├── init-letsencrypt.sh           # Первоначальная установка SSL
│   ├── init-letsencrypt-standalone.sh # Standalone установка SSL
│   ├── renew-cert.sh                 # Обновление сертификатов
│   └── force-renew-cert.sh           # Принудительное обновление
│
└── 🔧 Обслуживание
    ├── update-backend-deps.sh        # Обновление npm пакетов
    └── fix-go-modules.sh             # Исправление Go модулей
```

---

## 📚 Documentation (`docs/`)

```
docs/
├── 📊 Мониторинг
│   ├── API_MONITORING.md             # Эндпоинты мониторинга (/ping, /health, /api/status)
│   ├── MONITORING_OPTIONS.md         # Выбор системы мониторинга (сравнение)
│   └── UPTIMEROBOT_SETUP.md          # Настройка UptimeRobot (пошагово)
│
├── 🏗️ Архитектура
│   ├── BACKEND_ARCHITECTURE.md       # Backend архитектура (DDD)
│   └── MIGRATION_GUIDE.md            # Миграция на новую архитектуру
│
├── 🔒 Безопасность
│   ├── SECURITY_AUDIT.md             # Аудит безопасности
│   ├── SECURITY_IMPROVEMENTS.md      # Рекомендации
│   └── SECURITY_SUMMARY.md           # Краткая сводка
│
├── ⚙️ Настройка
│   ├── DATABASE.md                   # Настройка БД
│   ├── NGINX_FIX.md                  # Настройка Nginx
│   └── DEPLOY.md                     # Деплой на продакшн
│
├── 🎯 Функциональность
│   ├── SESSION_SETUP.md              # Сессии
│   ├── CART_TESTING.md               # Корзина
│   └── UPLOADS_SETUP.md              # Загрузка файлов
│
├── 📋 Гайды
│   ├── QUICK_START.md                # Быстрый старт
│   └── CONTRIBUTING.md               # Как контрибьютить
│
└── 📝 История
    ├── CHANGELOG.md                  # История изменений
    ├── REFACTORING_SUMMARY.md        # Что было сделано
    └── PRODUCTION_READY.md           # Готовность к продакшну
```

---

## 🧪 Tests (`tests/`)

```
tests/
└── 📁 back/                          # Backend тесты
    └── test-vk-backend.js            # VK Mini App backend тесты
```

---

## 🔐 SSL Certificates (`certbot/`)

```
certbot/
├── 📁 conf/                          # SSL сертификаты (не в git)
│   └── live/sushiritto.ru/
│       ├── fullchain.pem
│       └── privkey.pem
│
└── 📁 www/                           # ACME challenge files
```

---

## 📱 VK Mini App (`vk-mini-app/`)

VK Mini App на React для заказов через ВКонтакте.

```
vk-mini-app/
├── 📄 package.json
├── 📄 vite.config.ts
├── 📄 Dockerfile
├── 📄 .env
├── 📄 .env.example
│
└── 📁 src/
    ├── App.tsx
    ├── main.tsx
    ├── 📁 pages/
    ├── 📁 components/
    └── 📁 services/
```

---

## 🗂️ Временные файлы (`.temp/`)

Папка для временных файлов (не в git).

- Тестовые cookies
- Временные скрипты
- Дебаг файлы

---

## 🔍 Файлы конфигурации

### Docker
- `docker-compose.yml` - Оркестрация всех сервисов
- `back/Dockerfile` - Backend образ
- `front/Dockerfile` - Frontend образ
- `saby-service/Dockerfile` - Saby service образ

### Nginx
- `nginx.conf` - Production конфиг с HTTPS
- `nginx-http-only.conf` - HTTP only конфиг (для теста)

### Environment
- `.env.example` - Пример глобальных переменных
- `back/.env.example` - Пример backend переменных
- `saby-service/.env.example` - Пример saby-service переменных

### Git
- `.gitignore` - Список игнорируемых файлов

---

## 📦 Игнорируемые папки/файлы (`.gitignore`)

### Не в Git
- `node_modules/` - NPM пакеты
- `.env*` - Environment variables
- `*.log` - Логи
- `.DS_Store` - macOS файлы
- `.vscode/`, `.idea/` - IDE settings
- `back/public/uploads/` - Загруженные файлы
- `certbot/conf/` - SSL сертификаты
- `.temp/` - Временные файлы

---

## 🚀 Быстрая навигация

### Где что искать?

| Что нужно | Где искать |
|-----------|------------|
| API endpoints | `back/routes/` |
| Business logic | `back/controllers/`, `back/services/` |
| Database queries | `back/controllers/`, `back/config/postgres.js` |
| React components | `front/src/components/` |
| API documentation | `docs/` |
| Deployment scripts | `scripts/` |
| Environment variables | `.env.example`, `back/.env.example` |
| Database schema | `back/migrations/` |
| SBIS integration | `saby-service/` |
| Monitoring endpoints | `back/server.js` (see `/ping`, `/health`, `/api/status`) |

---

## 📊 Статистика проекта

**Backend:**
- Controllers: 7 файлов
- Routes: 7 файлов
- Middleware: 5 файлов
- Migrations: 6 файлов

**Frontend:**
- React + TypeScript + Vite
- TailwindCSS для стилей

**Services:**
- Backend: Node.js 18+ (Express)
- Frontend: React 18 (Vite)
- Database: PostgreSQL 15
- Saby Service: Go 1.24
- Reverse Proxy: Nginx
- SSL: Let's Encrypt (Certbot)

**Scripts:** 12 утилитарных скриптов

**Документация:** 20+ документов

---

## 🔗 Связанные документы

- [README.md](./README.md) - Главная документация
- [scripts/README.md](./scripts/README.md) - Документация скриптов
- [docs/](./docs/) - Полная документация

