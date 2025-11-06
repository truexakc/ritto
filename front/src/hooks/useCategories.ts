import { useQuery } from "@tanstack/react-query";
import { getCategories } from "../services/product";
import { Category } from "../types/Category";

export const useCategories = () => {
    return useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: getCategories,
    });
};

