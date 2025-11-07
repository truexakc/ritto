# Changelog

Все значимые изменения в проекте будут документированы в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
и проект придерживается [Semantic Versioning](https://semver.org/lang/ru/).

## [Unreleased]

### Added
- Новая архитектура backend на основе DDD (Domain-Driven Design)
- Разделение кода по доменам (auth, product, category, cart, order, payment)
- Инфраструктурный слой с middleware и конфигурацией
- Полная документация проекта в папке `docs/`
- README с навигацией и быстрым стартом
- Backend Architecture документация
- .gitignore для всего проекта
- .env.example с примерами переменных окружения
- CHANGELOG.md для отслеживания изменений

### Changed
- Реорганизована структура backend проекта
- Перенесена документация в папку `docs/`
- Обновлен package.json для работы с новой структурой
- Улучшена организация middleware
- Централизована конфигурация (CORS, Session)

### Fixed
- Исправлена ошибка с неиспользуемым импортом в BasketList.tsx
- Улучшена обработка ошибок в контроллерах

## [1.0.0] - 2024-XX-XX

### Added
- Первый релиз платформы Ritto
- Аутентификация пользователей (JWT)
- Управление продуктами и категориями
- Корзина покупок
- Система заказов
- Интеграция с Stripe для оплаты
- Docker конфигурация
- Nginx reverse proxy
- PostgreSQL база данных
- React frontend с TailwindCSS
- Админ панель

### Security
- Helmet для защиты HTTP заголовков
- XSS-Clean для защиты от XSS атак
- HPP для защиты от HTTP Parameter Pollution
- JWT токены с refresh механизмом
- Безопасное хранение паролей (bcrypt)

---

## Типы изменений

- `Added` - новые функции
- `Changed` - изменения в существующей функциональности
- `Deprecated` - функции, которые скоро будут удалены
- `Removed` - удаленные функции
- `Fixed` - исправления багов
- `Security` - исправления уязвимостей
