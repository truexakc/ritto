// types/Discount.ts
export interface Discount {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    old_price: number;
    new_price: number;
    image: string;
    product_id: string;
    is_active: boolean;
    created_at: string;
}
