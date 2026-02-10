# Диаграмма потока заказов

## Полная цепочка обработки заказа

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              КЛИЕНТ                                     │
│                         (Web / VK Mini App)                             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ 1. POST /api/orders
                                 │    {
                                 │      products: [{id, quantity}],
                                 │      shipping_address: "...",
                                 │      phone_number: "+7...",
                                 │      payment_method: "card",
                                 │      delivery_method: "delivery"
                                 │    }
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACK-SERVICE                                  │
│                            (Node.js)                                    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ orderController.js                                               │  │
│  │                                                                  │  │
│  │  1. Валидация входных данных                                    │  │
│  │     ├─ Проверка обязательных полей                              │  │
│  │     ├─ Проверка формата телефона                                │  │
│  │     └─ Проверка способа доставки                                │  │
│  │                                                                  │  │
│  │  2. Получение цен из БД                                         │  │
│  │     └─ SELECT price FROM products WHERE id IN (...)             │  │
│  │                                                                  │  │
│  │  3. Расчет итоговой суммы                                       │  │
│  │     └─ total = Σ(price × quantity)                              │  │
│  │                                                                  │  │
│  │  4. Сохранение в БД                                             │  │
│  │     ├─ INSERT INTO orders (...)                                 │  │
│  │     └─ INSERT INTO order_items (...)                            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                 │                                       │
│                                 │ 5. Вызов интеграции                   │
│                                 ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ sabyIntegration.js                                               │  │
│  │                                                                  │  │
│  │  sendOrderToSaby(order, orderItems, user)                       │  │
│  │                                                                  │  │
│  │  1. Маппинг данных                                              │  │
│  │     ├─ product: "delivery"                                      │  │
│  │     ├─ pointId: SBIS_POINT_ID                                   │  │
│  │     ├─ customer: {name, phone, email}                           │  │
│  │     ├─ datetime: formatDateTimeForSBIS()                        │  │
│  │     ├─ nomenclatures: [{id, count, priceListId}]                │  │
│  │     └─ delivery: {isPickup, addressFull, paymentType}           │  │
│  │                                                                  │  │
│  │  2. Маппинг способа оплаты                                      │  │
│  │     ├─ "card" → "card"                                          │  │
│  │     ├─ "cash" → "cash"                                          │  │
│  │     └─ "online" → "online"                                      │  │
│  │                                                                  │  │
│  │  3. HTTP POST → saby-service                                    │  │
│  │     └─ axios.post(SABY_SERVICE_URL/api/v1/orders)               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ 6. POST /api/v1/orders
                                 │    {
                                 │      product: "delivery",
                                 │      pointId: 1,
                                 │      customer: {...},
                                 │      nomenclatures: [...],
                                 │      delivery: {...}
                                 │    }
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SABY-SERVICE                                   │
│                              (Go)                                       │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ handler/order_handler.go                                         │  │
│  │                                                                  │  │
│  │  CreateOrder(c *gin.Context)                                    │  │
│  │                                                                  │  │
│  │  1. Парсинг JSON запроса                                        │  │
│  │     └─ c.ShouldBindJSON(&req)                                   │  │
│  │                                                                  │  │
│  │  2. Валидация структуры                                         │  │
│  │     ├─ Проверка обязательных полей                              │  │
│  │     ├─ Проверка формата email                                   │  │
│  │     └─ Проверка формата телефона (E.164)                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                 │                                       │
│                                 │ 3. Вызов сервиса                      │
│                                 ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ service/saby_service.go                                          │  │
│  │                                                                  │  │
│  │  CreateOrder(ctx, req)                                          │  │
│  │                                                                  │  │
│  │  1. Бизнес-валидация                                            │  │
│  │     ├─ Проверка product != ""                                   │  │
│  │     ├─ Проверка pointId > 0                                     │  │
│  │     ├─ Проверка customer.name != ""                             │  │
│  │     ├─ Проверка nomenclatures не пустой                         │  │
│  │     └─ Проверка address если isPickup=false                     │  │
│  │                                                                  │  │
│  │  2. Обработка контекста                                         │  │
│  │     └─ Проверка ctx.Done() для отмены                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                 │                                       │
│                                 │ 4. Вызов клиента                      │
│                                 ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ client/saby_client.go                                            │  │
│  │                                                                  │  │
│  │  CreateOrder(ctx, req)                                          │  │
│  │                                                                  │  │
│  │  1. Сериализация в JSON                                         │  │
│  │     └─ json.Marshal(req)                                        │  │
│  │                                                                  │  │
│  │  2. Создание HTTP запроса                                       │  │
│  │     ├─ POST https://api.sbis.ru/retail/order/create             │  │
│  │     ├─ Header: Content-Type: application/json                   │  │
│  │     └─ Header: X-SBISAccessToken: <token>                       │  │
│  │                                                                  │  │
│  │  3. Выполнение запроса                                          │  │
│  │     └─ httpClient.Do(req.WithContext(ctx))                      │  │
│  │                                                                  │  │
│  │  4. Парсинг ответа                                              │  │
│  │     └─ json.Unmarshal(body, &sbisResponse)                      │  │
│  │                                                                  │  │
│  │  5. Маппинг в OrderResponse                                     │  │
│  │     ├─ OrderID: uuid.New()                                      │  │
│  │     ├─ ExternalID: "SBIS-{state}"                               │  │
│  │     ├─ Status: mapSBISState(state)                              │  │
│  │     └─ CreatedAt: time.Now()                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ 7. POST /retail/order/create
                                 │    Headers:
                                 │      X-SBISAccessToken: <token>
                                 │    Body: {
                                 │      product: "delivery",
                                 │      pointId: 1,
                                 │      customer: {...},
                                 │      nomenclatures: [...],
                                 │      delivery: {...}
                                 │    }
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            SBIS API                                     │
│                         (Saby Retail)                                   │
│                                                                         │
│  1. Аутентификация по токену                                           │
│  2. Валидация данных заказа                                            │
│  3. Создание заказа в системе доставки                                 │
│  4. Возврат ответа                                                     │
│     {                                                                  │
│       "state": 1,                                                      │
│       "payments": [                                                    │
│         {                                                              │
│           "amount": 1000,                                              │
│           "paymentType": "card",                                       │
│           "isClosed": false                                            │
│         }                                                              │
│       ]                                                                │
│     }                                                                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ 8. Response
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
            ┌───────────────┐         ┌──────────────┐
            │ Saby-service  │         │ Back-service │
            │   Логирует    │         │   Логирует   │
            │   результат   │         │   результат  │
            └───────────────┘         └──────────────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
                                 │ 9. Response to client
                                 │    {
                                 │      "message": "Заказ успешно создан",
                                 │      "order": {...}
                                 │    }
                                 ▼
                            ┌─────────┐
                            │ КЛИЕНТ  │
                            └─────────┘
```

## Обработка ошибок

### Сценарий 1: Ошибка валидации в back-service

```
Клиент → Back-service
              │
              ├─ Валидация не прошла
              │
              └─ HTTP 400 Bad Request
                 {
                   "message": "Укажите номер телефона"
                 }
```

### Сценарий 2: Saby-service недоступен

```
Back-service → Saby-service
              │
              ├─ Connection refused
              │
              ├─ Заказ сохранен в БД ✓
              │
              ├─ Логируется ошибка
              │
              └─ HTTP 201 Created (клиенту)
                 {
                   "message": "Заказ успешно создан",
                   "order": {...}
                 }
                 
                 ⚠️  Требуется ручная отправка в SBIS
```

### Сценарий 3: SBIS API вернул ошибку

```
Saby-service → SBIS API
              │
              ├─ HTTP 400 Bad Request
              │  {
              │    "error": "Invalid pointId"
              │  }
              │
              ├─ Логируется детальная ошибка
              │
              └─ HTTP 500 Internal Server Error
                 {
                   "error": {
                     "code": "INTERNAL_ERROR",
                     "message": "Internal server error"
                   }
                 }
```

### Сценарий 4: Timeout

```
Saby-service → SBIS API
              │
              ├─ Timeout (30 секунд)
              │
              ├─ Логируется timeout
              │
              └─ HTTP 408 Request Timeout
                 {
                   "error": {
                     "code": "TIMEOUT",
                     "message": "Request timeout"
                   }
                 }
```

## Логирование

### Back-service (Node.js)

```javascript
// При отправке
📤 Отправка заказа в Saby-service: { orderId: 123, userId: 456 }
📦 Payload для Saby: {...}

// При успехе
✅ Заказ успешно отправлен в Saby: { orderId: 123, sabyOrderId: "..." }

// При ошибке
❌ Ошибка отправки заказа в Saby: { orderId: 123, error: "...", status: 500 }
```

### Saby-service (Go)

```go
// При получении
[request-id] Processing order creation request

// При отправке в SBIS
📤 Sending order to SBIS API: https://api.sbis.ru/retail/order/create
📦 Request payload: {...}

// При получении ответа
📥 SBIS API response status: 200, body: {...}

// При успехе
✅ Order created successfully: uuid (SBIS state: 1)

// При ошибке
[request-id] Service error: failed to execute request: ...
```

## Мониторинг метрик

```
┌─────────────────────────────────────────────────────────────┐
│                      МЕТРИКИ                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Back-service:                                              │
│    • orders_created_total                                   │
│    • saby_requests_total                                    │
│    • saby_requests_success                                  │
│    • saby_requests_failed                                   │
│    • saby_request_duration_seconds                          │
│                                                             │
│  Saby-service:                                              │
│    • orders_received_total                                  │
│    • sbis_requests_total                                    │
│    • sbis_requests_success                                  │
│    • sbis_requests_failed                                   │
│    • sbis_request_duration_seconds                          │
│                                                             │
│  Алерты:                                                    │
│    • saby_error_rate > 5%                                   │
│    • sbis_error_rate > 5%                                   │
│    • saby_response_time > 5s                                │
│    • sbis_response_time > 10s                               │
│    • saby_service_down > 1m                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
