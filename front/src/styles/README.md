# Система стилей

Централизованная система управления стилями для приложения.

## Структура

### `theme.ts` - Основная тема
Содержит все цвета, размеры, отступы и базовые стили:

- **colors** - Цветовая палитра (primary, background, text, status, opacity)
- **gradients** - Готовые градиенты
- **shadows** - Тени
- **borderRadius** - Радиусы скругления
- **transitions** - Анимации и переходы
- **spacing** - Размеры контейнеров и отступы
- **blur** - Эффекты размытия

### `components.ts` - Стили компонентов
Готовые классы для переиспользуемых компонентов:

- **buttonStyles** - Кнопки (primary, secondary, ghost, danger)
- **cardStyles** - Карточки (base, hover, elevated)
- **inputStyles** - Поля ввода
- **iconStyles** - Иконки
- **avatarStyles** - Аватары (small, medium, large)
- **badgeStyles** - Бейджи
- **linkStyles** - Ссылки
- **containerStyles** - Контейнеры
- **textStyles** - Типографика (h1, h2, h3, body, muted, small)
- **decorativeStyles** - Декоративные элементы
- **modalStyles** - Модальные окна
- **menuStyles** - Меню

### `classNames.ts` - Утилиты
Вспомогательные функции для работы с классами:

- **cn()** - Объединение классов
- **conditional()** - Условное применение классов

## Использование

### Импорт
```typescript
import { colors, buttonStyles, cn } from '../styles';
```

### Примеры

#### Использование цветов
```typescript
<div className={`bg-[${colors.primary.main}]`}>
  <p className={`text-[${colors.text.primary}]`}>Текст</p>
</div>
```

#### Использование готовых стилей
```typescript
<button className={buttonStyles.primary}>
  Кнопка
</button>

<div className={cardStyles.hover}>
  Карточка
</div>
```

#### Объединение классов
```typescript
<div className={cn(
  cardStyles.base,
  "p-6",
  "hover:scale-105"
)}>
  Контент
</div>
```

#### Условные классы
```typescript
<header className={cn(
  "fixed top-0",
  conditional(
    isScrolled,
    "bg-black shadow-lg",
    "bg-transparent"
  )
)}>
  Header
</header>
```

## Редактирование

### Изменение цветов
Отредактируйте `theme.ts`:
```typescript
export const colors = {
  primary: {
    main: '#e8262b',  // Измените здесь
    dark: '#d12025',
    light: '#ff3b40',
  },
  // ...
}
```

### Добавление новых стилей
Добавьте в `components.ts`:
```typescript
export const myNewStyles = {
  variant1: `${colors.primary.main} ${borderRadius.lg}`,
  variant2: `bg-white/10 ${transitions.fast}`,
} as const;
```

### Создание новых компонентов
```typescript
import { colors, buttonStyles, cn } from '../styles';

const MyComponent = () => {
  return (
    <button className={cn(
      buttonStyles.primary,
      "custom-class"
    )}>
      Кнопка
    </button>
  );
};
```

## Преимущества

✅ Централизованное управление стилями
✅ Легкое изменение темы
✅ Переиспользование кода
✅ Консистентность дизайна
✅ TypeScript поддержка
✅ Автодополнение в IDE

## Миграция существующих компонентов

1. Импортируйте нужные стили из `../styles`
2. Замените хардкод цветов на переменные из `colors`
3. Используйте готовые стили из `components.ts`
4. Применяйте `cn()` для объединения классов
