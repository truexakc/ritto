import { Product } from "./Product";

export interface CartItem {
    id: string; // id строки в таблице cart
    productId: string;
    quantity: number;

    // из products
    name: string;
    price: number;
    image: string;
    category: string;
    description: string;
}


export type CartItemWithProduct = Product & {
    id: string;         // ID строки в таблице cart
    quantity: number;   // Кол-во в корзине
};
