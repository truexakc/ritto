// src/store/slices/cartSlice.ts
import {createSlice, createAsyncThunk, PayloadAction} from "@reduxjs/toolkit";
import {axiosInstance} from "../../services/axios.ts";
import {CartItem} from "../../types/Cart";
import {AxiosError} from "axios";

interface CartState {
    items: CartItem[];
    loading: boolean;
    error: string | null;
}

const initialState: CartState = {
    items: [],
    loading: false,
    error: null,
};

// 🔹 Получение корзины
export const fetchCart = createAsyncThunk<CartItem[]>(
    "cart/fetchCart",
    async (_, thunkAPI) => {
        try {
            const res = await axiosInstance.get("/cart");
            return res.data.items;
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                return thunkAPI.rejectWithValue(err.response?.data?.message || "Ошибка запроса");
            }
            return thunkAPI.rejectWithValue("Неизвестная ошибка");
        }
    }
);

// 🔹 Добавление товара
export const addToCart = createAsyncThunk<
    { productId: string; quantity: number },
    { productId: string; quantity: number },
    { rejectValue: string }
>("cart/addToCart", async ({ productId, quantity }, thunkAPI) => {
    try {
        await axiosInstance.post("/cart/add", { product_id: productId, quantity });
        return { productId, quantity };
    } catch (err: unknown) {
        if (err instanceof AxiosError) {
            if (err.response?.status === 401) {
                return thunkAPI.rejectWithValue("Не авторизован"); // 💥 ВАЖНО
            }
            return thunkAPI.rejectWithValue(err.response?.data?.message || "Ошибка запроса");
        }
        return thunkAPI.rejectWithValue("Неизвестная ошибка");
    }
});


// 🔹 Удаление одной единицы
export const removeFromCart = createAsyncThunk<
    { productId: string },
    string
>("cart/removeFromCart", async (productId, thunkAPI) => {
    try {
        await axiosInstance.post("/cart/remove", {product_id: productId});
        return {productId}; // возвращаем id
    } catch (err: unknown) {
        if (err instanceof AxiosError) {
            return thunkAPI.rejectWithValue(err.response?.data?.message || "Ошибка запроса");
        }
        return thunkAPI.rejectWithValue("Неизвестная ошибка");
    }
});
;

export const clearCartThunk = createAsyncThunk<void>(
    "cart/clearCart",
    async (_, thunkAPI) => {
        try {
            await axiosInstance.post("/cart/clear");
            thunkAPI.dispatch(fetchCart());
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                return thunkAPI.rejectWithValue(err.response?.data?.message || "Ошибка запроса");
            }
            return thunkAPI.rejectWithValue("Неизвестная ошибка");
        }
    }
);


// 🔹 Слайс
const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCart.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCart.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
                state.items = action.payload;
                state.loading = false;
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(addToCart.fulfilled, (state, action) => {
                const {productId, quantity} = action.payload;
                const existingItem = state.items.find(item => item.productId === productId);
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    // Пример простого добавления нового товара (без деталей)
                    state.items.push({
                        id: Math.random().toString(), // временный id
                        productId,
                        quantity,
                        name: '',
                        price: 0,
                        image: '',
                        category: '',
                        description: ''
                    });
                }
            })

            .addCase(removeFromCart.fulfilled, (state, action) => {
                const {productId} = action.payload;
                const index = state.items.findIndex(item => item.productId === productId);
                if (index !== -1) {
                    if (state.items[index].quantity > 1) {
                        state.items[index].quantity -= 1;
                    } else {
                        state.items.splice(index, 1);
                    }
                }
            })
            .addCase(clearCartThunk.fulfilled, (state) => {
                state.items = [];
            });

    },
});

export default cartSlice.reducer;
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartLoading = (state: { cart: CartState }) => state.cart.loading;
