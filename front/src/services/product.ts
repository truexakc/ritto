import { axiosInstance } from "./axios";
import { Product } from "../types/Product";
import { Category } from "../types/Category";

/**
 * Получить список категорий
 * GET /api/products/category
 */
export const getCategories = async (): Promise<Category[]> => {
    const response = await axiosInstance.get('/products/category');
    return response.data;
};

/**
 * Получить список всех продуктов
 * GET /api/products
 */
export const getProducts = async (hierarchicalParent?: string): Promise<Product[]> => {
    const query = hierarchicalParent ? `?hierarchical_parent=${encodeURIComponent(hierarchicalParent)}` : '';
    const response = await axiosInstance.get(`/products${query}`);
    return response.data;
};

export const getPopularProducts = async (): Promise<Product[]> => {
    const res = await axiosInstance.get('/products/popular');
    return res.data;
};


/**
 * Получить один продукт по ID
 * GET /api/products/:id
 */
export const getProductById = async (id: string): Promise<Product> => {
    const response = await axiosInstance.get(`/products/${id}`);
    return response.data;
};

/**
 * Создать новый продукт (только для администратора)
 * POST /api/products
 */
export const createProduct = async (product: Omit<Product, "id">) => {
    const response = await axiosInstance.post("/products", product);
    return response.data;
};

/**
 * Обновить продукт по ID (только для администратора)
 * PUT /api/products/:id
 */
export const updateProduct = async (
    id: string,
    updatedProduct: Partial<Product>
) => {
    const response = await axiosInstance.put(`/products/${id}`, updatedProduct);
    return response.data;
};

/**
 * Удалить продукт по ID (только для администратора)
 * DELETE /api/products/:id
 */
export const deleteProduct = async (id: string) => {
    const response = await axiosInstance.delete(`/products/${id}`);
    return response.data;
};
