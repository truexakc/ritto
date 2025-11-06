// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { fetchCart, addToCart, removeFromCart } from "../services/cart";
// import { useAppDispatch } from "../store/hooks";
// import { setCart } from "../store/slices/cartSlice";
// import type { CartItem } from "../types/Cart";
//
// export const useCart = () => {
//     const queryClient = useQueryClient();
//     const dispatch = useAppDispatch();
//
//     // 📦 Получение корзины (v5 совместимо — без дженерика)
//     const query = useQuery({
//         queryKey: ["cart"],
//         queryFn: fetchCart,
//         staleTime: 1000 * 60 * 5,
//         refetchOnWindowFocus: false,
//         onSuccess: (data: CartItem[]) => {
//             dispatch(setCart(data));
//         },
//     });
//
//     // ➕ Добавление товара
//     const addMutation = useMutation({
//         mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
//             addToCart(productId, quantity),
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ["cart"] });
//         },
//     });
//
//     // ➖ Удаление товара
//     const removeMutation = useMutation({
//         mutationFn: (productId: string) => removeFromCart(productId),
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ["cart"] });
//         },
//     });
//
//     return {
//         cartItems: query.data ?? [],
//         isLoading: query.isPending,          // ✅ корректный флаг загрузки
//         isError: query.isError,
//         error: query.error,
//         addToCart: addMutation.mutate,
//         removeFromCart: removeMutation.mutate,
//         isAdding: addMutation.isPending,     // ✅ заменили .status === 'pending'
//         isRemoving: removeMutation.isPending,
//     };
// };
