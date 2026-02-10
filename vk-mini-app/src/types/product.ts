/**
 * Product Types
 * Types for product catalog and product data
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  available: boolean;
}
