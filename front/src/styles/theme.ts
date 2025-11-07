// Цветовая палитра приложения
export const colors = {
  // Основные цвета бренда
  primary: {
    main: '#e8262b',
    dark: '#d12025',
    light: '#ff3b40',
  },
  
  // Фоновые цвета
  background: {
    primary: '#0a0a0a',
    secondary: '#1a1a1a',
    tertiary: '#0c0c0c',
    dark: '#151515',
    card: '#1C1C1C',
  },
  
  // Текстовые цвета
  text: {
    primary: '#E9E9E9',
    secondary: '#ADADAD',
    muted: '#808080',
  },
  
  // Цвета состояний
  status: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  
  // Прозрачности
  opacity: {
    white5: 'rgba(255, 255, 255, 0.05)',
    white10: 'rgba(255, 255, 255, 0.1)',
    white20: 'rgba(255, 255, 255, 0.2)',
    primary10: 'rgba(232, 38, 43, 0.1)',
    primary20: 'rgba(232, 38, 43, 0.2)',
    primary50: 'rgba(232, 38, 43, 0.5)',
  },
} as const;

// Градиенты
export const gradients = {
  primary: 'bg-gradient-to-br from-[#e8262b] to-[#d12025]',
  primaryReverse: 'bg-gradient-to-br from-[#d12025] to-[#e8262b]',
  background: 'bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0c0c0c]',
  text: 'bg-gradient-to-r from-[#e8262b] to-[#d12025] bg-clip-text text-transparent',
} as const;

// Тени
export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  '3xl': 'shadow-3xl',
  none: 'shadow-none',
} as const;

// Радиусы скругления
export const borderRadius = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  full: 'rounded-full',
} as const;

// Анимации и переходы
export const transitions = {
  fast: 'transition-all duration-200',
  normal: 'transition-all duration-300',
  slow: 'transition-all duration-500',
  colors: 'transition-colors duration-200',
  transform: 'transition-transform duration-300',
} as const;

// Размеры
export const spacing = {
  container: {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-[1920px]',
    full: 'max-w-full',
  },
  padding: {
    page: 'px-4 lg:px-8 xl:px-12 2xl:px-16',
    section: 'py-12 px-4',
    card: 'p-6 md:p-8',
  },
} as const;

// Эффекты размытия
export const blur = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
} as const;
