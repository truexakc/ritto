# Интеграция цепочки оформления заказов

## Обзор

Документ описывает полную цепочку обработки заказов от back-service до SBIS API через saby-service.

## Архитектура потока

```
Клиент (Web/VK Mini App)
    ↓
    POST /api/orders
    ↓
Back-service (Node.js)
    ├─ Сохраняет заказ в БД
    ├─ Валидирует данные
    └─ Отправляет в Saby-service →
                                    ↓
                            Saby-service (Go)
                                ├─ Маппинг данных
                                ├─ Валидация
                                └─ Отправляет в SBIS API →
                                                            ↓
                                                    SBIS API (Saby Retail)
                                                        └─ Создает заказ в системе доставки
```

## Текущее состояние

### ✅ Что работает:
- Back-service принимает и сохраняет заказы в БД
- Saby-service имеет endpoint для приема заказов
- Saby-service имеет структуры данных для SBIS API

### ❌ Что нужно доработать:
1. Back-service НЕ вызывает saby-service после создания заказа
2. Saby-service возвращает placeholder вместо реального вызова SBIS API
3. Нет маппинга данных между форматами back-service и SBIS API

## Формат данных

### Back-service → Saby-service

**Входные данные (back-service):**
```json
{
  "products": [
    {
      "id": 123,
      "quantity": 2
    }
  ],
  "shipping_address": "ул. Тестовая, д. 1, кв. 1",
  "phone_number": "+79991234567",
  "payment_method": "card",
  "delivery_method": "delivery",
  "comment": "Комментарий к заказу",
  "extra_ginger": 1,
  "extra_soy_sauce": 2,
  "extra_wasabi": 1,
  "chopsticks_count": 2
}
```

**Выходные данные (для saby-service):**
```json
{
  "product": "delivery",
  "pointId": 1,
  "comment": "Комментарий к заказу",
  "customer": {
    "name": "Имя пользователя",
    "phone": "+79991234567"
  },
  "datetime": "2026-02-09 15:30:00",
  "nomenclatures": [
    {
      "id": 123,
      "count": 2,
      "priceListId": 1
    }
  ],
  "delivery": {
    "isPickup": false,
    "addressFull": "ул. Тестовая, д. 1, кв. 1",
    "paymentType": "card"
  }
}
```

### Saby-service → SBIS API

**Формат запроса к SBIS API:**
```
POST https://api.sbis.ru/retail/order/create
Headers:
  X-SBISAccessToken: <token>
  Content-Type: application/json
```

**Тело запроса:**
```json
{
  "product": "delivery",
  "pointId": 1,
  "comment": "Комментарий",
  "customer": {
    "name": "Иван",
    "lastname": "Иванов",
    "phone": "+79991234567",
    "email": "test@example.com"
  },
  "datetime": "2026-02-09 15:30:00",
  "nomenclatures": [
    {
      "id": 123,
      "count": 2,
      "cost": 500,
      "name": "Название продукта",
      "priceListId": 1
    }
  ],
  "delivery": {
    "isPickup": false,
    "addressFull": "ул. Тестовая, д. 1, кв. 1",
    "paymentType": "card"
  }
}
```

**Ответ от SBIS API:**
```json
{
  "state": 1,
  "payments": [
    {
      "amount": 1000,
      "paymentType": "card",
      "isClosed": false
    }
  ]
}
```

## Маппинг полей

### payment_method → paymentType

| Back-service | SBIS API | Описание |
|--------------|----------|----------|
| `card` | `card` | Оплата картой |
| `cash` | `cash` | Оплата наличными |
| `online` | `online` | Онлайн оплата (эквайринг) |

**Для первой версии:** поддерживаем только `card` и `cash`.

### delivery_method → isPickup

| Back-service | SBIS API | Описание |
|--------------|----------|----------|
| `delivery` | `isPickup: false` | Доставка |
| `pickup` | `isPickup: true` | Самовывоз |

## План реализации

### Этап 1: Интеграция back-service → saby-service

**Файл:** `back/services/sabyIntegration.js`

```javascript
const axios = require('axios');
const logger = require('../utils/logger');

const SABY_SERVICE_URL = process.env.SABY_SERVICE_URL || 'http://saby-service:8080';

async function sendOrderToSaby(order, orderItems, user) {
  try {
    const payload = {
      product: 'delivery',
      pointId: parseInt(process.env.SBIS_POINT_ID || '1'),
      comment: order.comment || '',
      customer: {
        name: user.name || 'Клиент',
        phone: order.phone_number,
        email: user.email
      },
      datetime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      nomenclatures: orderItems.map(item => ({
        id: item.product_id,
        count: item.quantity,
        priceListId: parseInt(process.env.SBIS_PRICE_LIST_ID || '1')
      })),
      delivery: {
        isPickup: order.delivery_method === 'pickup',
        addressFull: order.shipping_address,
        paymentType: mapPaymentMethod(order.payment_method)
      }
    };

    const response = await axios.post(
      `${SABY_SERVICE_URL}/api/v1/orders`,
      payload,
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    logger.log('✅ Заказ отправлен в Saby:', response.data);
    return response.data;
  } catch (error) {
    logger.error('❌ Ошибка отправки заказа в Saby:', error.message);
    throw error;
  }
}

function mapPaymentMethod(method) {
  const mapping = {
    'card': 'card',
    'cash': 'cash',
    'online': 'online'
  };
  return mapping[method] || 'card';
}

module.exports = { sendOrderToSaby };
```

**Изменения в:** `back/controllers/orderController.js`

После создания заказа добавить вызов:
```javascript
// После успешного создания заказа
try {
  await sendOrderToSaby(order, orderItemsWithId, req.user);
} catch (error) {
  logger.error('Не удалось отправить заказ в Saby, но заказ сохранен:', error);
  // Не прерываем выполнение - заказ уже создан
}
```

### Этап 2: Реализация реального API в saby-service

**Файл:** `saby-service/internal/client/saby_client.go`

Заменить placeholder на реальный HTTP вызов:

```go
func (c *sabyClientImpl) CreateOrder(ctx context.Context, req *model.OrderRequest) (*model.OrderResponse, error) {
    // Marshal request to JSON
    jsonData, err := json.Marshal(req)
    if err != nil {
        return nil, fmt.Errorf("failed to marshal request: %w", err)
    }

    // Create HTTP request
    apiURL := fmt.Sprintf("%s/retail/order/create", c.baseURL)
    httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %w", err)
    }

    // Set headers
    httpReq.Header.Set("Content-Type", "application/json")
    httpReq.Header.Set("X-SBISAccessToken", c.apiKey)

    // Execute request
    resp, err := c.httpClient.Do(httpReq)
    if err != nil {
        return nil, fmt.Errorf("failed to execute request: %w", err)
    }
    defer resp.Body.Close()

    // Check status code
    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("unexpected status code %d: %s", resp.StatusCode, string(body))
    }

    // Parse response
    var sbisResponse struct {
        State    int                      `json:"state"`
        Payments []map[string]interface{} `json:"payments"`
    }
    if err := json.NewDecoder(resp.Body).Decode(&sbisResponse); err != nil {
        return nil, fmt.Errorf("failed to decode response: %w", err)
    }

    // Map to OrderResponse
    response := &model.OrderResponse{
        OrderID:    uuid.New().String(),
        ExternalID: fmt.Sprintf("SBIS-%d", sbisResponse.State),
        Status:     "created",
        CreatedAt:  time.Now(),
        Message:    "Order created successfully",
    }

    return response, nil
}
```

### Этап 3: Конфигурация

**Переменные окружения для back-service:**
```env
SABY_SERVICE_URL=http://saby-service:8080
SBIS_POINT_ID=1
SBIS_PRICE_LIST_ID=1
```

**Переменные окружения для saby-service:**
```env
SABY_API_URL=https://api.sbis.ru
SABY_API_KEY=<ваш токен>
SBIS_ACCESS_TOKEN=<ваш токен>
```

## Тестирование

### Локальное тестирование

1. Запустить сервисы:
```bash
# Back-service
cd back && npm start

# Saby-service
cd saby-service && go run cmd/app/main.go
```

2. Запустить тестовый скрипт:
```bash
./test-order-flow.sh
```

### Проверка на проде

1. Проверить health endpoints:
```bash
curl https://sushiritto.ru/api/health
curl https://sushiritto.ru/saby/health
```

2. Создать тестовый заказ через API
3. Проверить логи обоих сервисов
4. Проверить заказ в SBIS панели

## Обработка ошибок

### Сценарии ошибок:

1. **Saby-service недоступен**
   - Заказ сохраняется в БД
   - Логируется ошибка
   - Можно повторить отправку позже

2. **SBIS API вернул ошибку**
   - Логируется детальная ошибка
   - Заказ помечается как "требует внимания"
   - Админ получает уведомление

3. **Timeout**
   - Retry с экспоненциальной задержкой
   - Максимум 3 попытки

## Мониторинг

### Метрики для отслеживания:

- Количество успешных отправок в Saby
- Количество ошибок интеграции
- Время ответа SBIS API
- Количество заказов в очереди на повторную отправку

### Логирование:

- Все запросы к saby-service
- Все ответы от SBIS API
- Все ошибки с полным контекстом

## Безопасность

1. **Токены доступа:**
   - Хранить в переменных окружения
   - Не логировать в открытом виде
   - Ротация токенов по расписанию

2. **Валидация данных:**
   - Проверка всех обязательных полей
   - Санитизация пользовательского ввода
   - Проверка формата телефона и email

3. **Rate limiting:**
   - Ограничение запросов к SBIS API
   - Защита от DDoS

## Следующие шаги

1. ✅ Создать тестовый скрипт
2. ⏳ Реализовать интеграцию в back-service
3. ⏳ Реализовать реальный API в saby-service
4. ⏳ Добавить обработку ошибок
5. ⏳ Протестировать локально
6. ⏳ Развернуть на проде
7. ⏳ Мониторинг и логирование
