# Тесты проекта Ritto

## Структура

```
tests/
├── manual/              # Ручные тесты
│   ├── test-browser-cart.html  # Тест корзины в браузере
│   ├── nginx-test.sh           # Тест Nginx конфигурации
│   └── test-cart.sh            # Тест API корзины
└── README.md
```

## Автоматические тесты

### Backend

```bash
cd back
npm test
```

**Тесты находятся в:**
- `back/__tests__/` - unit и integration тесты
  - `auth.test.js` - тесты аутентификации
  - `cart.test.js` - тесты корзины
  - `admin.test.js` - тесты админки

### Frontend

```bash
cd front
npm test
```

## Ручные тесты

### 1. Тест корзины в браузере

**Файл:** `manual/test-browser-cart.html`

**Как использовать:**
1. Запустите backend: `cd back && npm run dev`
2. Откройте `test-browser-cart.html` в браузере
3. Следуйте инструкциям на странице

**Что тестирует:**
- Добавление товара в корзину
- Получение корзины
- Удаление товара
- Очистка корзины
- Работа с сессиями

### 2. Тест Nginx

**Файл:** `manual/nginx-test.sh`

**Как использовать:**
```bash
chmod +x manual/nginx-test.sh
./manual/nginx-test.sh
```

**Что тестирует:**
- Конфигурация Nginx
- Проксирование запросов
- CORS headers
- Static files

### 3. Тест API корзины

**Файл:** `manual/test-cart.sh`

**Как использовать:**
```bash
chmod +x manual/test-cart.sh
./manual/test-cart.sh
```

**Что тестирует:**
- POST /api/cart - добавление товара
- GET /api/cart - получение корзины
- DELETE /api/cart - удаление товара
- POST /api/cart/clear - очистка корзины

## Создание новых тестов

### Unit тест (Backend)

```javascript
// back/__tests__/example.test.js
const exampleService = require('../src/domains/example/example.service');

describe('ExampleService', () => {
    test('should return data', async () => {
        const result = await exampleService.getData();
        expect(result).toBeDefined();
    });
});
```

### Integration тест (Backend)

```javascript
// back/__tests__/example-integration.test.js
const request = require('supertest');
const { app } = require('../src/server');

describe('Example API', () => {
    test('GET /api/example should return 200', async () => {
        const response = await request(app)
            .get('/api/example')
            .expect(200);
        
        expect(response.body).toBeDefined();
    });
});
```

### Ручной тест (Shell)

```bash
#!/bin/bash
# tests/manual/test-example.sh

API_URL="http://localhost:5001"

echo "Testing Example API..."

# Test 1: GET request
curl -X GET "$API_URL/api/example" \
  -H "Content-Type: application/json"

echo "✅ Test completed"
```

## CI/CD

### GitHub Actions (пример)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd back
          npm install
      
      - name: Run tests
        run: |
          cd back
          npm test
```

## Coverage

```bash
# Backend coverage
cd back
npm run test:coverage

# Просмотр отчета
open coverage/lcov-report/index.html
```

## Полезные команды

```bash
# Запустить все тесты
npm test

# Запустить конкретный тест
npm test -- auth.test.js

# Запустить в watch режиме
npm test -- --watch

# Запустить с coverage
npm run test:coverage

# Запустить только измененные тесты
npm test -- --onlyChanged
```

## Troubleshooting

### Тесты падают с ошибкой подключения к БД

**Решение:**
```bash
# Убедитесь что PostgreSQL запущен
docker-compose up -d postgres

# Или локально
brew services start postgresql
```

### Timeout ошибки

**Решение:**
Увеличьте timeout в jest.config.js:
```javascript
module.exports = {
    testTimeout: 10000 // 10 секунд
};
```

### Порт занят

**Решение:**
```bash
# Найти процесс
lsof -i :5001

# Убить процесс
kill -9 <PID>
```

## Best Practices

1. **Изолируйте тесты** - каждый тест должен быть независимым
2. **Используйте моки** - для внешних сервисов
3. **Очищайте данные** - после каждого теста
4. **Тестируйте edge cases** - не только happy path
5. **Пишите понятные названия** - describe и test должны быть читаемыми
6. **Используйте beforeEach/afterEach** - для setup и cleanup
7. **Не тестируйте implementation details** - тестируйте поведение

## Ресурсы

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

Для вопросов создавайте issue в репозитории.
