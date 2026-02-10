/**
 * Order Types
 * Types for order data and order responses
 */

import type { CartItem } from './cart';

export interface OrderData {
  request_id: string; // Client-generated UUID for idempotency
  items: CartItem[];
  delivery_method: 'delivery' | 'pickup';
  delivery_address?: string;
  phone: string;
  comment?: string;
  frontend_total: number; // For comparison only, backend will recompute
}

export interface Order {
  id: number;
  request_id: string;
  vk_user_id: number;
  vk_user_name: string;
  items: OrderItem[];
  total_price: number; // Recomputed by backend
  frontend_total_price: number;
  delivery_method: 'delivery' | 'pickup';
  delivery_address?: string;
  phone: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: Date;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number; // Actual price from catalog at order time
}

export interface OrderResponse {
  order_id: number;
  actual_total_price: number;
  message: string;
}
