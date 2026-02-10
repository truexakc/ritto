/**
 * Storage Service
 * Manages local storage for cart persistence
 */

import type { CartItem } from '../types/cart';

const CART_STORAGE_KEY = 'vk_mini_app_cart';

/**
 * Save cart items to local storage
 * @param cart - Array of cart items to persist
 */
export function saveCart(cart: CartItem[]): void {
  try {
    const serialized = JSON.stringify(cart);
    localStorage.setItem(CART_STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save cart to local storage:', error);
    // Silently fail - don't throw to avoid breaking the app
  }
}

/**
 * Load cart items from local storage
 * @returns Array of cart items, or empty array if none found
 */
export function loadCart(): CartItem[] {
  try {
    const serialized = localStorage.getItem(CART_STORAGE_KEY);
    if (!serialized) {
      return [];
    }
    const parsed = JSON.parse(serialized);
    // Validate that parsed data is an array
    if (!Array.isArray(parsed)) {
      console.warn('Invalid cart data in local storage, returning empty cart');
      return [];
    }
    return parsed;
  } catch (error) {
    console.error('Failed to load cart from local storage:', error);
    return [];
  }
}

/**
 * Clear cart from local storage
 */
export function clearCart(): void {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear cart from local storage:', error);
    // Silently fail - don't throw to avoid breaking the app
  }
}
