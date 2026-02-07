import { axiosInstance } from "./axios";
import { Product } from "../types/Product";
import { Category } from "../types/Category";

/**
 * Получить список категорий
 * GET /api/catalog/categories
 */
export const getCategories = async (): Promise<Category[]> => {
    const response = await axiosInstance.get('/catalog/categories');
    return response.data;
};

/**
 * Получить список всех продуктов
 * GET /api/catalog/products
 */
export const getProducts = async (hierarchicalParent?: string): Promise<Product[]> => {
    const query = hierarchicalParent ? `?hierarchical_parent=${encodeURIComponent(hierarchicalParent)}` : '';
    const response = await axiosInstance.get(`/catalog/products${query}`);
    return response.data;
};

export const getPopularProducts = async (): Promise<Product[]> => {
    const res = await axiosInstance.get('/catalog/products/popular');
    return res.data;
};
