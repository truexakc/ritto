/**
 * Утилита для объединения классов CSS
 * Удаляет undefined, null, false и пустые строки
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Условное применение классов
 */
export const conditional = (condition: boolean, trueClass: string, falseClass?: string): string => {
  return condition ? trueClass : (falseClass || '');
};
