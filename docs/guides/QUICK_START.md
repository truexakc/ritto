# 🚀 Быстрый старт Ritto

## Для разработчиков

### Вариант 1: Docker (Рекомендуется)

```bash
# 1. Клонировать репозиторий
git clone <repository-url>
cd ritto

# 2. Создать .env файл
cp .env.example .env
# Отредактируйте .env и установите пароли

# 3. Запустить все сервисы
docker-compose up -d

# 4. Проверить статус
docker-compose ps

# 5. Просмотреть логи
docker-compose logs -f backend
```

**Доступ к сервисам:**
- Frontend: http://localhost
- Backend API: http://localhost:5001
- Adminer (БД): http://localhost:8080
- Portainer: http://localhost:9000

### Вариант 2: Локальная разработка

#### Требования
- Node.js 18+
- PostgreSQL 15+
- npm или yarn

#### Backend

```bash
# 1. Перейти в папку backend
cd back

# 2. Установить зависимости
npm install

# 3. Создать .env
cp .env.example .env

# 4. Настроить PostgreSQL
# Создать базу данных ritto_db
createdb ritto_db

# 5. Применить миграции
psql -U postgres -d ritto_db -f migrations/001_initial_schema.sql
psql -U postgres -d ritto_db -f migrations/002_seed_data.sql

# 6. Запустить в режиме разработки
npm run dev
```

Backend будет доступен на http://localhost:5001

#### Frontend

```bash
# 1. Перейти в папку frontend
cd front

# 2. Установить зависимости
npm install

# 3. Запустить в режиме разработки
npm run dev
```

Frontend будет доступен на http://localhost:5173

## Основные команды

### Docker

```bash
# Запуск
docker-compose up -d

# Остановка
docker-compose down

# Перезапуск сервиса
docker-compose restart backend

# Просмотр логов
docker-compose logs -f

# Пересборка
docker-compose build

# Очистка
docker-compose down -v
```

### Backend

```bash
cd back

# Разработка (новая архитектура)
npm run dev

# Разработка (старая архитектура)
npm run dev:old

# Продакшн
npm start

# Тесты
npm test

# Линтинг
npm run lint
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

# Тесты
npm test
```

## Проверка работоспособности

### 1. Проверка Backend

```bash
# Проверка здоровья API
curl http://localhost:5001/health

# Проверка каталога через saby-service
curl http://localhost:8080/api/catalog/categories

# Должен вернуть список категорий
```

### 2. Проверка Frontend

Откройте http://localhost:5173 в браузере

### 3. Проверка БД

Откройте http://localhost:8080 (Adminer)
- Сервер: postgres
- Пользователь: postgres
- Пароль: (из .env)
- База данных: ritto_db

## Структура проекта

```
ritto/
├── back/               # Backend
│   ├── src/           # Новая архитектура (DDD)
│   ├── controllers/   # Старый код (legacy)
│   └── routes/        # Старый код (legacy)
├── front/             # Frontend
├── docs/              # Документация
└── docker-compose.yml
```

## Переменные окружения

Основные переменные в `.env`:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=ritto_db

# Backend
PORT=5001
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...

# Client
CLIENT_URL=http://localhost:5173
```

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Профиль

### Продукты (Catalog)
- `GET /api/catalog/categories` - Категории
- `GET /api/catalog/products` - Список продуктов
- `GET /api/catalog/products/popular` - Популярные продукты
- `POST /api/catalog/import` - Запустить импорт каталога (admin)
- `GET /api/catalog/import/status` - Статус импорта

### Корзина
- `GET /api/cart` - Получить корзину
- `POST /api/cart` - Добавить товар
- `DELETE /api/cart/:id` - Удалить товар

### Заказы
- `GET /api/orders` - Список заказов
- `POST /api/orders` - Создать заказ

## Troubleshooting

### Ошибка подключения к БД

```bash
# Проверить статус PostgreSQL
docker-compose ps postgres

# Перезапустить
docker-compose restart postgres
```

### Ошибка CORS

Убедитесь, что `CLIENT_URL` в `.env` соответствует адресу фронтенда.

### Порт занят

```bash
# Найти процесс на порту 5001
lsof -i :5001

# Убить процесс
kill -9 <PID>
```

### Ошибка npm install

```bash
# Очистить кэш
npm cache clean --force

# Удалить node_modules
rm -rf node_modules package-lock.json

# Переустановить
npm install
```

## Полезные ссылки

- [Полная документация](./README.md)
- [Backend Architecture](./docs/architecture/BACKEND_ARCHITECTURE.md)
- [Migration Guide](./docs/MIGRATION_GUIDE.md)
- [Changelog](./CHANGELOG.md)

## Следующие шаги

1. ✅ Запустить проект
2. 📖 Изучить [Backend Architecture](./docs/architecture/BACKEND_ARCHITECTURE.md)
3. 🔧 Настроить IDE
4. 🧪 Запустить тесты
5. 💻 Начать разработку

## Поддержка

При возникновении проблем:
1. Проверьте [Troubleshooting](#troubleshooting)
2. Изучите документацию в `docs/`
3. Создайте issue в репозитории

---

**Готово! Приятной разработки! 🚀**
