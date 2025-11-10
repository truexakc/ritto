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

// 🔹 Тихое обновление корзины (без индикатора загрузки)
export const silentFetchCart = createAsyncThunk<CartItem[]>(
    "cart/silentFetchCart",
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
        // Автоматически обновляем корзину после добавления (без индикатора загрузки)
        thunkAPI.dispatch(silentFetchCart());
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
        // Автоматически обновляем корзину после удаления (без индикатора загрузки)
        thunkAPI.dispatch(silentFetchCart());
        return {productId}; // возвращаем id
    } catch (err: unknown) {
        if (err instanceof AxiosError) {
            return thunkAPI.rejectWithValue(err.response?.data?.message || "Ошибка запроса");
        }
        return thunkAPI.rejectWithValue("Неизвестная ошибка");
    }
});

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

// 🔹 Перенос корзины из сессии в БД при авторизации
export const mergeSessionCart = createAsyncThunk<void>(
    "cart/mergeSessionCart",
    async (_, thunkAPI) => {
        try {
            await axiosInstance.post("/cart/merge");
            // После переноса обновляем корзину
            thunkAPI.dispatch(fetchCart());
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                return thunkAPI.rejectWithValue(err.response?.data?.message || "Ошибка переноса корзины");
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
            .addCase(silentFetchCart.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
                // Обновляем items без изменения loading
                state.items = action.payload;
            })
            .addCase(addToCart.fulfilled, () => {
                // Не обновляем items здесь, дождемся silentFetchCart
            })
            .addCase(addToCart.rejected, (state, action) => {
                state.error = action.payload as string;
            })

            .addCase(removeFromCart.fulfilled, () => {
                // Не обновляем items здесь, дождемся silentFetchCart
            })
            .addCase(removeFromCart.rejected, (state, action) => {
                state.error = action.payload as string;
            })
            .addCase(clearCartThunk.fulfilled, (state) => {
                state.items = [];
            });

    },
});

export default cartSlice.reducer;
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartLoading = (state: { cart: CartState }) => state.cart.loading;
