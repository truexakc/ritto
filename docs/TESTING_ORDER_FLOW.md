# Тестирование цепочки оформления заказов

## Быстрый старт

### 1. Локальное тестирование (без реального SBIS API)

Проверяет маппинг данных и взаимодействие между сервисами:

```bash
# Запустить back-service
cd back
npm install
npm start

# В другом терминале запустить saby-service
cd saby-service
go run cmd/app/main.go

# В третьем терминале запустить тесты
./test-saby-integration-local.sh
```

### 2. Полное тестирование (с реальным SBIS API)

**Требования:**
- Валидный `SBIS_ACCESS_TOKEN` в `saby-service/.env`
- Валидный `SBIS_POINT_ID` и `SBIS_PRICE_LIST_ID`

```bash
# Настроить переменные окружения
cd saby-service
cp .env.example .env
# Отредактировать .env и добавить реальные токены

# Запустить полный тест
./test-order-flow.sh
```

## Что тестируется

### Тест 1: Доступность сервисов
- ✅ Back-service отвечает на `/health`
- ✅ Saby-service отвечает на `/health`

### Тест 2: Создание заказа в back-service
- ✅ Регистрация пользователя
- ✅ Получение токена авторизации
- ✅ Создание заказа через `POST /api/orders`
- ✅ Сохранение заказа в БД

### Тест 3: Отправка в saby-service
- ✅ Back-service вызывает saby-service
- ✅ Маппинг данных корректен
- ✅ Формат запроса соответствует SBIS API

### Тест 4: Интеграция с SBIS API
- ✅ Saby-service отправляет запрос в SBIS
- ✅ Обработка ответа от SBIS
- ✅ Возврат результата в back-service

## Проверка логов

### Back-service
```bash
cd back
npm start

# Ожидаемые логи при создании заказа:
# 📤 Отправка заказа в Saby-service: { orderId: 123, userId: 456 }
# 📦 Payload для Saby: {...}
# ✅ Заказ успешно отправлен в Saby: { orderId: 123, sabyOrderId: "..." }
```

### Saby-service
```bash
cd saby-service
go run cmd/app/main.go

# Ожидаемые логи при получении заказа:
# 📤 Sending order to SBIS API: https://api.sbis.ru/retail/order/create
# 📦 Request payload: {...}
# 📥 SBIS API response status: 200, body: {...}
# ✅ Order created successfully: ... (SBIS state: 1)
```

## Отладка проблем

### Проблема: Back-service не может подключиться к saby-service

**Симптомы:**
```
❌ Ошибка отправки заказа в Saby: connect ECONNREFUSED
```

**Решение:**
1. Проверить что saby-service запущен: `curl http://localhost:8080/health`
2. Проверить `SABY_SERVICE_URL` в `back/.env`
3. Для Docker: использовать имя сервиса вместо localhost

### Проблема: SBIS API возвращает 401 Unauthorized

**Симптомы:**
```
❌ unexpected status code 401: Unauthorized
```

**Решение:**
1. Проверить `SBIS_ACCESS_TOKEN` в `saby-service/.env`
2. Убедиться что токен не истек
3. Проверить формат токена (без лишних пробелов)

### Проблема: Валидация не проходит

**Симптомы:**
```
❌ unexpected status code 400: validation error
```

**Решение:**
1. Проверить обязательные поля в запросе
2. Проверить формат телефона (должен быть E.164: +79991234567)
3. Проверить формат даты (гггг-мм-дд чч:мм:сс)
4. Убедиться что `nomenclatures` не пустой массив

## Тестирование на проде

### Предварительная проверка

```bash
# 1. Проверить health endpoints
curl https://sushiritto.ru/api/health
curl https://sushiritto.ru/saby/health

# 2. Проверить переменные окружения
ssh user@server
cd /path/to/project
docker-compose exec back env | grep SABY
docker-compose exec saby-service env | grep SBIS
```

### Создание тестового заказа

```bash
# 1. Получить токен авторизации
TOKEN=$(curl -s -X POST https://sushiritto.ru/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  | jq -r '.token')

# 2. Создать заказ
curl -X POST https://sushiritto.ru/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [{"id": 1, "quantity": 1}],
    "shipping_address": "Тестовый адрес",
    "phone_number": "+79991234567",
    "payment_method": "card",
    "delivery_method": "delivery"
  }'

# 3. Проверить логи
docker-compose logs -f back | grep Saby
docker-compose logs -f saby-service | grep SBIS
```

### Проверка в SBIS панели

1. Войти в панель SBIS: https://online.sbis.ru
2. Перейти в раздел "Заказы"
3. Найти созданный заказ по времени создания
4. Проверить статус и детали заказа

## Мониторинг

### Метрики для отслеживания

1. **Успешность интеграции:**
   - Процент успешных отправок в Saby
   - Процент успешных ответов от SBIS API

2. **Производительность:**
   - Время ответа saby-service
   - Время ответа SBIS API

3. **Ошибки:**
   - Количество 4xx ошибок (валидация)
   - Количество 5xx ошибок (серверные)
   - Количество timeout'ов

### Алерты

Настроить уведомления для:
- Процент ошибок > 5%
- Время ответа > 5 секунд
- Saby-service недоступен > 1 минуты

## Чеклист перед продакшеном

- [ ] Настроены все переменные окружения
- [ ] Токены SBIS API валидны и не истекают
- [ ] Проверена интеграция на тестовом окружении
- [ ] Настроено логирование
- [ ] Настроен мониторинг
- [ ] Настроены алерты
- [ ] Документация обновлена
- [ ] Команда проинформирована

## Полезные команды

```bash
# Проверить версию сервисов
curl http://localhost:5001/health | jq
curl http://localhost:8080/health | jq

# Проверить логи в реальном времени
docker-compose logs -f back saby-service

# Перезапустить сервисы
docker-compose restart back saby-service

# Проверить переменные окружения
docker-compose exec back env | grep SABY
docker-compose exec saby-service env | grep SBIS
```
