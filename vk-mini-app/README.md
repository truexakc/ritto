# VK Mini App - Ritto Food Delivery

VK Mini App для платформы доставки еды Ritto, работающее внутри экосистемы VK.

## Технологии

- React 18+
- TypeScript
- Vite
- VKUI (UI компоненты VK)
- VK Bridge (интеграция с платформой VK)
- vk-mini-apps-router (навигация)
- fast-check (property-based testing)

## Структура проекта

```
vk-mini-app/
├── src/
│   ├── components/     # React компоненты
│   │   ├── Catalog/    # Компоненты каталога
│   │   ├── Cart/       # Компоненты корзины
│   │   └── Order/      # Компоненты заказа
│   ├── panels/         # Основные панели приложения
│   ├── services/       # Сервисы (API, VK Bridge, storage)
│   ├── types/          # TypeScript типы и интерфейсы
│   ├── utils/          # Утилиты
│   ├── App.tsx         # Главный компонент
│   └── main.tsx        # Точка входа
├── public/             # Статические файлы
└── dist/               # Собранное приложение
```

## Разработка

```bash
# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev

# Сборка для продакшена
npm run build

# Предпросмотр продакшен сборки
npm run preview
```

## Конфигурация

- **Port**: 10888 (настроено в vite.config.ts)
- **Base URL**: `./` (для корректной работы в VK)
- **Path aliases**: Настроены алиасы для удобного импорта (@components, @services, и т.д.)

## Интеграция с VK

Приложение использует VK Bridge для:
- Получения информации о пользователе
- Валидации Launch Params
- Интеграции с платформой VK

## API Endpoints

- **SABY Service** (каталог): `http://localhost:8080/api/catalog`
- **Backend API** (заказы): `http://localhost:5001/api/vk/orders`
- **Backend API** (auth): `http://localhost:5001/api/vk/auth`
