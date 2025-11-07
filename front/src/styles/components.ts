// Переиспользуемые классы компонентов
import { colors, gradients, borderRadius, transitions, shadows, blur } from './theme';

// Кнопки
export const buttonStyles = {
  primary: `${gradients.primary} text-white font-bold ${borderRadius.lg} px-8 py-4 ${shadows['2xl']} hover:${shadows['3xl']} ${transitions.normal}`,
  secondary: `bg-white/5 hover:bg-white/10 text-[${colors.text.primary}] font-medium ${borderRadius.lg} px-8 py-4 border border-white/10 hover:border-white/20 ${transitions.normal}`,
  ghost: `hover:bg-white/5 ${transitions.normal} ${borderRadius.md}`,
  danger: `bg-red-500 hover:bg-red-600 text-white font-bold ${borderRadius.lg} px-8 py-4 ${transitions.normal}`,
} as const;

// Карточки
export const cardStyles = {
  base: `bg-white/5 ${blur.sm} ${borderRadius.xl} border border-white/10 ${transitions.normal}`,
  hover: `bg-white/5 ${blur.sm} ${borderRadius.xl} border border-white/10 hover:border-white/20 hover:bg-white/10 ${transitions.normal}`,
  elevated: `bg-white/5 ${blur.sm} ${borderRadius.xl} border border-white/10 ${shadows.xl}`,
} as const;

// Инпуты
export const inputStyles = {
  base: `w-full px-4 py-2 bg-[${colors.background.card}] border border-gray-700 ${borderRadius.md} focus:outline-none focus:border-[${colors.primary.main}] ${transitions.colors}`,
  error: `w-full px-4 py-2 bg-[${colors.background.card}] border border-red-500 ${borderRadius.md} focus:outline-none`,
} as const;

// Иконки
export const iconStyles = {
  primary: `text-[${colors.primary.main}]`,
  secondary: `text-[${colors.text.secondary}]`,
  white: `text-white`,
  hover: `hover:scale-110 ${transitions.transform}`,
} as const;

// Аватары
export const avatarStyles = {
  small: `w-10 h-10 ${gradients.primary} ${borderRadius.full} flex items-center justify-center text-xl ${shadows.lg}`,
  medium: `w-16 h-16 ${gradients.primary} ${borderRadius.full} flex items-center justify-center text-3xl ${shadows.lg}`,
  large: `w-24 h-24 ${gradients.primary} ${borderRadius.full} flex items-center justify-center text-5xl ${shadows['2xl']}`,
} as const;

// Бейджи
export const badgeStyles = {
  primary: `bg-[${colors.primary.main}]/20 text-[${colors.primary.main}] px-3 py-1 ${borderRadius.full} text-sm font-semibold`,
  success: `bg-green-500/20 text-green-500 px-3 py-1 ${borderRadius.full} text-sm font-semibold`,
  warning: `bg-yellow-500/20 text-yellow-500 px-3 py-1 ${borderRadius.full} text-sm font-semibold`,
  info: `bg-blue-500/20 text-blue-500 px-3 py-1 ${borderRadius.full} text-sm font-semibold`,
} as const;

// Ссылки
export const linkStyles = {
  primary: `text-[${colors.primary.main}] hover:text-[${colors.primary.dark}] ${transitions.colors}`,
  secondary: `text-[${colors.text.secondary}] hover:text-[${colors.text.primary}] ${transitions.colors}`,
  underline: `text-[${colors.primary.main}] hover:text-[${colors.primary.dark}] underline ${transitions.colors}`,
} as const;

// Контейнеры
export const containerStyles = {
  page: `min-h-screen ${gradients.background} overflow-hidden py-20 px-4`,
  section: `py-12 px-4`,
  centered: `flex items-center justify-center min-h-screen`,
} as const;

// Текст
export const textStyles = {
  h1: `text-4xl lg:text-5xl font-black ${gradients.text}`,
  h2: `text-3xl lg:text-4xl font-bold text-[${colors.text.primary}]`,
  h3: `text-2xl lg:text-3xl font-bold text-[${colors.text.primary}]`,
  body: `text-base text-[${colors.text.primary}]`,
  muted: `text-sm text-[${colors.text.secondary}]`,
  small: `text-xs text-[${colors.text.muted}]`,
} as const;

// Декоративные элементы
export const decorativeStyles = {
  blob: {
    primary: `absolute w-80 h-80 bg-[${colors.primary.main}]/10 ${borderRadius.full} blur-3xl`,
    secondary: `absolute w-96 h-96 bg-[${colors.primary.main}]/5 ${borderRadius.full} blur-3xl`,
  },
  grid: `absolute inset-0 pointer-events-none opacity-10`,
  gridLine: {
    horizontal: `absolute inset-0 bg-gradient-to-r from-transparent via-[${colors.primary.main}] to-transparent w-full h-px`,
    vertical: `absolute inset-0 bg-gradient-to-b from-transparent via-[${colors.primary.main}] to-transparent w-px h-full`,
  },
} as const;

// Модальные окна
export const modalStyles = {
  overlay: `fixed inset-0 bg-black/80 ${blur.md} z-50 flex items-center justify-center`,
  content: `bg-[${colors.background.secondary}] ${borderRadius.xl} ${shadows['2xl']} max-w-md w-full mx-4 p-6`,
} as const;

// Меню
export const menuStyles = {
  mobile: `fixed inset-0 top-20 bg-[${colors.background.primary}] ${blur.md} z-[60] transform ${transitions.normal} ease-in-out`,
  desktop: `hidden lg:block`,
  item: `nav-link hover:text-[${colors.primary.main}] text-white ${transitions.colors}`,
} as const;
