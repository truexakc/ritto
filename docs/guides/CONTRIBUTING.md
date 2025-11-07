# Руководство по внесению вклада в проект Ritto

Спасибо за интерес к проекту! Мы рады любому вкладу.

## Кодекс поведения

- Будьте уважительны к другим участникам
- Конструктивная критика приветствуется
- Помогайте новичкам
- Следуйте принятым стандартам кода

## Как внести вклад

### 1. Сообщить об ошибке

Создайте issue с описанием:
- Что произошло
- Что ожидалось
- Шаги для воспроизведения
- Версия Node.js, ОС
- Скриншоты (если применимо)

### 2. Предложить улучшение

Создайте issue с описанием:
- Какую проблему решает
- Предлагаемое решение
- Альтернативные варианты

### 3. Внести код

#### Процесс

1. **Fork** репозитория
2. **Clone** вашего fork
3. Создайте **feature branch**
4. Внесите изменения
5. **Commit** с понятным сообщением
6. **Push** в ваш fork
7. Создайте **Pull Request**

#### Пример

```bash
# 1. Fork через GitHub UI

# 2. Clone
git clone https://github.com/YOUR_USERNAME/ritto.git
cd ritto

# 3. Создать branch
git checkout -b feature/amazing-feature

# 4. Внести изменения
# ... редактируйте файлы ...

# 5. Commit
git add .
git commit -m "feat: add amazing feature"

# 6. Push
git push origin feature/amazing-feature

# 7. Создать PR через GitHub UI
```

## Стандарты кода

### Backend (Node.js)

#### Структура нового домена

```
back/src/domains/your-domain/
├── your-domain.service.js      # Бизнес-логика
├── your-domain.controller.js   # HTTP обработка
└── your-domain.routes.js       # Маршруты
```

#### Пример Service

```javascript
const { query } = require('../../infrastructure/database/postgres');

class YourDomainService {
    async findAll() {
        const result = await query('SELECT * FROM table');
        return result.rows;
    }

    async findById(id) {
        const result = await query('SELECT * FROM table WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    async create(data) {
        const { field1, field2 } = data;
        const result = await query(
            'INSERT INTO table (field1, field2) VALUES ($1, $2) RETURNING *',
            [field1, field2]
        );
        return result.rows[0];
    }
}

module.exports = new YourDomainService();
```

#### Пример Controller

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

    async getById(req, res) {
        try {
            const { id } = req.params;
            const data = await yourDomainService.findById(id);
            
            if (!data) {
                return res.status(404).json({ message: 'Not found' });
            }
            
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

#### Пример Routes

```javascript
const express = require('express');
const router = express.Router();
const yourDomainController = require('./your-domain.controller');
const { protect, admin } = require('../../infrastructure/middleware/auth.middleware');

// Public routes
router.get('/', (req, res) => yourDomainController.getAll(req, res));
router.get('/:id', (req, res) => yourDomainController.getById(req, res));

// Protected routes
router.post('/', protect, (req, res) => yourDomainController.create(req, res));

// Admin routes
router.delete('/:id', protect, admin, (req, res) => yourDomainController.delete(req, res));

module.exports = router;
```

### Frontend (React)

#### Структура компонента

```javascript
import React, { useState, useEffect } from 'react';

const YourComponent = ({ prop1, prop2 }) => {
    const [state, setState] = useState(null);

    useEffect(() => {
        // Side effects
    }, []);

    const handleAction = () => {
        // Handler logic
    };

    return (
        <div className="container">
            {/* JSX */}
        </div>
    );
};

export default YourComponent;
```

### Стиль кода

#### Именование

- **camelCase** для переменных и функций: `getUserData`
- **PascalCase** для классов и компонентов: `UserProfile`
- **UPPER_SNAKE_CASE** для констант: `MAX_RETRY_COUNT`
- **kebab-case** для файлов: `user-profile.js`

#### Комментарии

```javascript
// ✅ Хорошо: объясняет "почему"
// Используем setTimeout для debounce, чтобы не перегружать API
setTimeout(() => fetchData(), 300);

// ❌ Плохо: объясняет "что" (и так видно из кода)
// Вызываем функцию fetchData
fetchData();
```

#### Обработка ошибок

```javascript
// ✅ Хорошо
try {
    const data = await fetchData();
    return data;
} catch (error) {
    console.error('Error fetching data:', error);
    throw new Error('Failed to fetch data');
}

// ❌ Плохо
try {
    const data = await fetchData();
    return data;
} catch (error) {
    // Молчаливое игнорирование ошибки
}
```

### Commit Messages

Следуем [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- `feat`: новая функция
- `fix`: исправление бага
- `docs`: изменения в документации
- `style`: форматирование, отступы
- `refactor`: рефакторинг кода
- `test`: добавление тестов
- `chore`: обновление зависимостей, конфигурации

#### Примеры

```bash
feat(auth): add password reset functionality

fix(cart): resolve item duplication issue

docs(readme): update installation instructions

refactor(product): migrate to new DDD architecture
```

## Тестирование

### Backend

```bash
cd back
npm test
```

Пишите тесты для:
- Критичной бизнес-логики
- API endpoints
- Утилитарных функций

Пример теста:

```javascript
const yourDomainService = require('./your-domain.service');

describe('YourDomainService', () => {
    test('findAll returns array', async () => {
        const result = await yourDomainService.findAll();
        expect(Array.isArray(result)).toBe(true);
    });

    test('findById returns object or null', async () => {
        const result = await yourDomainService.findById(1);
        expect(result === null || typeof result === 'object').toBe(true);
    });
});
```

### Frontend

```bash
cd front
npm test
```

## Pull Request

### Чеклист

- [ ] Код следует стандартам проекта
- [ ] Добавлены/обновлены тесты
- [ ] Все тесты проходят
- [ ] Обновлена документация (если нужно)
- [ ] Commit messages следуют стандарту
- [ ] Нет конфликтов с main branch
- [ ] PR описание понятно объясняет изменения

### Шаблон PR

```markdown
## Описание
Краткое описание изменений

## Тип изменения
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Как протестировать
1. Шаг 1
2. Шаг 2
3. Ожидаемый результат

## Скриншоты (если применимо)

## Чеклист
- [ ] Код следует стандартам
- [ ] Тесты добавлены/обновлены
- [ ] Документация обновлена
```

## Архитектурные решения

При добавлении новых фич:

1. **Следуйте DDD**: создавайте новые домены в `src/domains/`
2. **Применяйте SOLID**: разделяйте ответственность
3. **Используйте KISS**: простота важнее сложности
4. **Документируйте**: обновляйте README и docs

## Вопросы?

- Изучите [Backend Architecture](./docs/architecture/BACKEND_ARCHITECTURE.md)
- Посмотрите примеры в `src/domains/auth` и `src/domains/product`
- Создайте issue с вопросом
- Спросите в PR

## Лицензия

Внося вклад, вы соглашаетесь, что ваш код будет лицензирован под MIT License.

---

Спасибо за вклад в проект Ritto! 🎉
