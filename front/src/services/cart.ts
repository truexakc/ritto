import { axiosInstance } from "./axios";
import { CartItem } from "../types/Cart";

// Получить корзину пользователя
export const fetchCart = async (): Promise<CartItem[]> => {
    const response = await axiosInstance.get("/cart", {
        withCredentials: true,
    });

    // Преобразуем данные в формат { productId, quantity }
    return response.data.items.map((item: any) => ({
        productId: item.product_id,
        quantity: item.quantity,
    }));
};

// Добавить товар в корзину (или увеличить количество)
export const addToCart = async (
    productId: string,
    quantity: number = 1
): Promise<{ message: string }> => {
    const response = await axiosInstance.post(
        "/cart/add",
        { product_id: productId, quantity },
        { withCredentials: true }
    );

    return response.data;
};

// Удалить товар (или уменьшить на 1)
export const removeFromCart = async (
    productId: string
): Promise<{ message: string }> => {
    const response = await axiosInstance.post(
        "/cart/remove",
        { product_id: productId },
        { withCredentials: true }
    );

    return response.data;
};
