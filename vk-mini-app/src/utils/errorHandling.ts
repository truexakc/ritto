/**
 * Error Handling Utilities
 * Provides error message formatting, error type detection, and error display helpers
 */

/**
 * Error types for categorization
 */
export const ErrorType = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTH: 'auth',
  RATE_LIMIT: 'rate_limit',
  SERVER: 'server',
  UNKNOWN: 'unknown',
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

/**
 * Error codes from backend API
 */
export const ErrorCode = {
  // Authentication errors
  AUTH_INVALID_SIGNATURE: 'AUTH_INVALID_SIGNATURE',
  AUTH_EXPIRED_PARAMS: 'AUTH_EXPIRED_PARAMS',
  AUTH_MISSING_PARAMS: 'AUTH_MISSING_PARAMS',
  
  // Validation errors
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_INVALID_VALUE: 'VALIDATION_INVALID_VALUE',
  
  // Integration errors
  SABY_SERVICE_UNAVAILABLE: 'SABY_SERVICE_UNAVAILABLE',
  TELEGRAM_SEND_FAILED: 'TELEGRAM_SEND_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // Business logic errors
  CART_EMPTY: 'CART_EMPTY',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_UNAVAILABLE: 'PRODUCT_UNAVAILABLE',
  ORDER_CREATION_FAILED: 'ORDER_CREATION_FAILED',
  PRICE_MISMATCH: 'PRICE_MISMATCH',
  DUPLICATE_ORDER: 'DUPLICATE_ORDER',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

/**
 * Structured error information
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  code?: string;
  details?: unknown;
  isRecoverable: boolean;
}

/**
 * Detect error type from error object or message
 */
export function detectErrorType(error: unknown): ErrorType {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('timeout')
    ) {
      return ErrorType.NETWORK;
    }
    
    // Authentication errors
    if (
      message.includes('auth') ||
      message.includes('unauthorized') ||
      message.includes('invalid authentication') ||
      message.includes('restart the app')
    ) {
      return ErrorType.AUTH;
    }
    
    // Rate limit errors
    if (
      message.includes('too many') ||
      message.includes('rate limit') ||
      message.includes('try again later')
    ) {
      return ErrorType.RATE_LIMIT;
    }
    
    // Validation errors
    if (
      message.includes('validation') ||
      message.includes('required') ||
      message.includes('invalid')
    ) {
      return ErrorType.VALIDATION;
    }
    
    // Server errors
    if (
      message.includes('server') ||
      message.includes('service unavailable') ||
      message.includes('internal error')
    ) {
      return ErrorType.SERVER;
    }
  }
  
  return ErrorType.UNKNOWN;
}

/**
 * Format error message for user display
 * Converts technical error messages to user-friendly Russian messages
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // Return message as-is if it's already in Russian
    if (/[а-яА-ЯёЁ]/.test(message)) {
      return message;
    }
    
    // Map common English error messages to Russian
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch failed')) {
      return 'Ошибка сети. Проверьте подключение к интернету.';
    }
    
    if (lowerMessage.includes('authentication failed') || lowerMessage.includes('unauthorized')) {
      return 'Ошибка аутентификации. Перезапустите приложение.';
    }
    
    if (lowerMessage.includes('too many orders') || lowerMessage.includes('rate limit')) {
      return 'Слишком много заказов. Попробуйте позже.';
    }
    
    if (lowerMessage.includes('failed to fetch catalog') || lowerMessage.includes('catalog')) {
      return 'Не удалось загрузить каталог. Попробуйте еще раз.';
    }
    
    if (lowerMessage.includes('failed to create order') || lowerMessage.includes('order')) {
      return 'Не удалось создать заказ. Попробуйте еще раз.';
    }
    
    if (lowerMessage.includes('product not found')) {
      return 'Товар не найден в каталоге.';
    }
    
    if (lowerMessage.includes('product unavailable')) {
      return 'Товар недоступен для заказа.';
    }
    
    if (lowerMessage.includes('invalid order data')) {
      return 'Некорректные данные заказа. Проверьте заполнение формы.';
    }
    
    if (lowerMessage.includes('service unavailable')) {
      return 'Сервис временно недоступен. Попробуйте позже.';
    }
    
    // Return original message if no mapping found
    return message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Произошла неизвестная ошибка';
}

/**
 * Extract error information from various error types
 */
export function extractErrorInfo(error: unknown): ErrorInfo {
  const type = detectErrorType(error);
  const message = formatErrorMessage(error);
  
  // Determine if error is recoverable based on type
  const isRecoverable = 
    type === ErrorType.NETWORK ||
    type === ErrorType.SERVER ||
    type === ErrorType.RATE_LIMIT;
  
  let code: string | undefined;
  let details: unknown;
  
  if (error instanceof Error) {
    // Try to extract error code from error object
    const errorObj = error as any;
    code = errorObj.code || errorObj.errorCode;
    details = errorObj.details;
  }
  
  return {
    type,
    message,
    code,
    details,
    isRecoverable,
  };
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return detectErrorType(error) === ErrorType.NETWORK;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  return detectErrorType(error) === ErrorType.AUTH;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  return detectErrorType(error) === ErrorType.VALIDATION;
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  return detectErrorType(error) === ErrorType.RATE_LIMIT;
}

/**
 * Check if error is recoverable (can be retried)
 */
export function isRecoverableError(error: unknown): boolean {
  const errorInfo = extractErrorInfo(error);
  return errorInfo.isRecoverable;
}

/**
 * Get user-friendly error title based on error type
 */
export function getErrorTitle(errorType: ErrorType): string {
  switch (errorType) {
    case ErrorType.NETWORK:
      return 'Ошибка сети';
    case ErrorType.AUTH:
      return 'Ошибка аутентификации';
    case ErrorType.VALIDATION:
      return 'Ошибка валидации';
    case ErrorType.RATE_LIMIT:
      return 'Превышен лимит';
    case ErrorType.SERVER:
      return 'Ошибка сервера';
    case ErrorType.UNKNOWN:
    default:
      return 'Ошибка';
  }
}

/**
 * Get retry button text based on error type
 */
export function getRetryButtonText(errorType: ErrorType): string {
  switch (errorType) {
    case ErrorType.NETWORK:
    case ErrorType.SERVER:
      return 'Повторить';
    case ErrorType.AUTH:
      return 'Перезагрузить';
    case ErrorType.RATE_LIMIT:
      return 'Понятно';
    default:
      return 'OK';
  }
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Extract validation errors from error object
 * Returns array of field-specific validation errors
 */
export function extractValidationErrors(error: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (error instanceof Error) {
    const errorObj = error as any;
    
    // Check if error has validation details
    if (errorObj.details && typeof errorObj.details === 'object') {
      const details = errorObj.details;
      
      // Handle different validation error formats
      if (Array.isArray(details)) {
        // Array of validation errors
        details.forEach((detail: any) => {
          if (detail.field && detail.message) {
            errors.push({
              field: detail.field,
              message: detail.message,
            });
          }
        });
      } else if (typeof details === 'object') {
        // Object with field names as keys
        Object.entries(details).forEach(([field, message]) => {
          if (typeof message === 'string') {
            errors.push({ field, message });
          }
        });
      }
    }
  }
  
  return errors;
}

/**
 * Create error message with validation details
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return 'Проверьте правильность заполнения формы';
  }
  
  if (errors.length === 1) {
    return errors[0].message;
  }
  
  return `Ошибки валидации:\n${errors.map(e => `• ${e.message}`).join('\n')}`;
}
