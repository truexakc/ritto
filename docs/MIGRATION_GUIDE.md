# Руководство по миграции на новую архитектуру

## Обзор

Проект был реорганизован с использованием принципов Domain-Driven Design (DDD), SOLID и KISS для улучшения поддерживаемости и масштабируемости.

## Что изменилось

### Структура Backend

**Старая структура:**
```
back/
├── controllers/
├── routes/
├── middleware/
├── config/
└── server.js
```

**Новая структура:**
```
back/
├── src/
│   ├── domains/          # Бизнес-домены
│   ├── infrastructure/   # Инфраструктура
│   ├── app.js
│   └── server.js
├── controllers/          # Legacy (будет удалено)
├── routes/              # Legacy (будет удалено)
└── server.js            # Legacy (будет удалено)
```

### Запуск приложения

**Старый способ:**
```bash
npm start          # node server.js
npm run dev        # nodemon server.js
```

**Новый способ:**
```bash
npm start          # node src/server.js
npm run dev        # nodemon src/server.js

# Старый способ все еще работает:
npm run start:old  # node server.js
npm run dev:old    # nodemon server.js
```

## Миграция существующего кода

### Шаг 1: Создание нового домена

Создайте структуру для нового домена:

```bash
mkdir -p back/src/domains/your-domain
touch back/src/domains/your-domain/your-domain.service.js
touch back/src/domains/your-domain/your-domain.controller.js
touch back/src/domains/your-domain/your-domain.routes.js
```

### Шаг 2: Перенос Service (бизнес-логика)

**Старый код (controllers/yourController.js):**
```javascript
const { query } = require('../config/postgres');

const getData = async (req, res) => {
    try {
        const result = await query('SELECT * FROM table');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
```

**Новый код (domains/your-domain/your-domain.service.js):**
```javascript
const { query } = require('../../infrastructure/database/postgres');

class YourDomainService {
    async findAll() {
        const result = await query('SELECT * FROM table');
        return result.rows;
    }
}

module.exports = new YourDomainService();
```

### Шаг 3: Создание Controller

**Новый код (domains/your-domain/your-domain.controller.js):**
```javascript
const yourDomainService = require('./your-domain.service');

class YourDomainController {
    async getAll(req, res) {
        try {
            const data = await yourDomainService.findAll();
            res.json(data);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ 
                message: 'Server error', 
                error: error.message 
            });
        }
    }
}

module.exports = new YourDomainController();
```

### Шаг 4: Создание Routes

**Новый код (domains/your-domain/your-domain.routes.js):**
```javascript
const express = require('express');
const router = express.Router();
const yourDomainController = require('./your-domain.controller');
const { protect, admin } = require('../../infrastructure/middleware/auth.middleware');

// Public routes
router.get('/', (req, res) => yourDomainController.getAll(req, res));

// Protected routes
router.post('/', protect, (req, res) => yourDomainController.create(req, res));

// Admin routes
router.delete('/:id', protect, admin, (req, res) => yourDomainController.delete(req, res));

module.exports = router;
```

### Шаг 5: Подключение в app.js

```javascript
// src/app.js
const yourDomainRoutes = require('./domains/your-domain/your-domain.routes');

// ...

app.use('/api/your-domain', yourDomainRoutes);
```

## Примеры миграции

### Пример 1: Auth Domain

**До:**
```javascript
// controllers/authController.js
const registerUser = async (req, res) => {
    // Вся логика в одном месте
    const { email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const result = await query('INSERT INTO users...');
    const token = jwt.sign(...);
    res.json({ token });
};
```

**После:**
```javascript
// domains/auth/auth.service.js
class AuthService {
    async createUser(email, password) {
        const hash = await this.hashPassword(password);
        const result = await query('INSERT INTO users...');
        return result.rows[0];
    }
    
    generateTokens(userId) {
        return {
            accessToken: jwt.sign(...),
            refreshToken: jwt.sign(...)
        };
    }
}

// domains/auth/auth.controller.js
class AuthController {
    async register(req, res) {
        try {
            const { email, password } = req.body;
            const user = await authService.createUser(email, password);
            const tokens = authService.generateTokens(user.id);
            res.json({ user, ...tokens });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}
```

### Пример 2: Product Domain

**До:**
```javascript
// controllers/productController.js
const getProducts = async (req, res) => {
    const { category } = req.query;
    let sql = 'SELECT * FROM products';
    if (category) sql += ' WHERE category = $1';
    const result = await query(sql, category ? [category] : []);
    res.json(result.rows);
};
```

**После:**
```javascript
// domains/product/product.service.js
class ProductService {
    async findAll(filters = {}) {
        const { category } = filters;
        let sql = 'SELECT * FROM products';
        const params = [];
        
        if (category) {
            sql += ' WHERE category = $1';
            params.push(category);
        }
        
        const result = await query(sql, params);
        return result.rows;
    }
}

// domains/product/product.controller.js
class ProductController {
    async getAll(req, res) {
        try {
            const { category } = req.query;
            const products = await productService.findAll({ category });
            res.json(products);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}
```

## Преимущества новой архитектуры

### 1. Разделение ответственности
- **Service** - бизнес-логика и работа с БД
- **Controller** - обработка HTTP запросов
- **Routes** - определение эндпоинтов

### 2. Легкость тестирования
```javascript
// Легко мокировать сервис
jest.mock('./your-domain.service');

test('controller returns data', async () => {
    yourDomainService.findAll.mockResolvedValue([{ id: 1 }]);
    // Тестируем контроллер
});
```

### 3. Переиспользование кода
```javascript
// Сервис можно использовать в разных местах
const data = await yourDomainService.findAll();
```

### 4. Масштабируемость
Легко добавлять новые домены без изменения существующего кода.

## Чеклист миграции

- [ ] Создать структуру домена
- [ ] Перенести бизнес-логику в Service
- [ ] Создать Controller для HTTP обработки
- [ ] Создать Routes
- [ ] Подключить routes в app.js
- [ ] Обновить импорты (если нужно)
- [ ] Написать тесты
- [ ] Удалить старый код
- [ ] Обновить документацию

## Совместимость

Старый и новый код работают параллельно:

```javascript
// src/app.js

// Новые домены
app.use('/api/auth', require('./domains/auth/auth.routes'));
app.use('/api/products', require('./domains/product/product.routes'));

// Старые routes (legacy)
app.use('/api/orders', require('../routes/orderRoutes'));
app.use('/api/cart', require('../routes/cartRoutes'));
```

## Постепенная миграция

1. **Фаза 1**: Новые фичи создаются в новой архитектуре
2. **Фаза 2**: Критичные домены мигрируются (auth, product)
3. **Фаза 3**: Остальные домены мигрируются по приоритету
4. **Фаза 4**: Удаление legacy кода

## Помощь и поддержка

При возникновении вопросов:
1. Изучите [Backend Architecture](./architecture/BACKEND_ARCHITECTURE.md)
2. Посмотрите примеры в `src/domains/auth` и `src/domains/product`
3. Создайте issue в репозитории

## Полезные команды

```bash
# Проверка работы нового кода
npm run dev

# Проверка работы старого кода
npm run dev:old

# Запуск тестов
npm test

# Линтинг
npm run lint
```
