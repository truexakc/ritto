// src/types/Product.ts
export interface Product {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    category_id: string;
    description: string;
    created_at: string;
    slug?: string;
    discount_price?: number | null;
    images?: string[];
    stock?: number;
    is_available?: boolean;
    is_featured?: boolean;
    weight?: string;
    unit?: string;
    updated_at?: string;
}


