/**
 * Cart Types
 * Types for shopping cart and cart items
 */

import type { Product } from './product';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
}
