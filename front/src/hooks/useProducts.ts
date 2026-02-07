// src/hooks/useProducts.ts
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../services/product";
import { Product } from "../types/Product";

export const useProducts = (params?: { hierarchicalParent?: string; search?: string }) => {
    return useQuery<Product[]>({
        queryKey: ["products", params?.hierarchicalParent, params?.search],
        queryFn: () => getProducts(params),
    });
};
