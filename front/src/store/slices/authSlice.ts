import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {getMe, login, register, LoginDto, RegisterDto, User} from '../../services/auth';
import {RootState} from '../store';
import {axiosInstance} from "../../services/axios.ts";

interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
    isInitialized: boolean;
}

const initialState: AuthState = {
    user: null,
    loading: false,
    error: null,
    isInitialized: false
};

// 🔹 Авторизация
export const loginUser = createAsyncThunk(
    'auth/login',
    async (data: LoginDto, thunkAPI) => {
        try {
            const result = await login(data);
            // Сохраняем токен в localStorage
            if (result.token) {
                localStorage.setItem('token', result.token);
            }
            return result;
        } catch (error: unknown) {
            if (error instanceof Error) {
                return thunkAPI.rejectWithValue(error.message);
            }
            return thunkAPI.rejectWithValue('Ошибка входа');
        }
    }
);

// 🔹 Регистрация
export const registerUser = createAsyncThunk(
    'auth/register',
    async (data: RegisterDto, thunkAPI) => {
        try {
            const result = await register(data);
            // Сохраняем токен в localStorage
            if (result.token) {
                localStorage.setItem('token', result.token);
            }
            return result;
        } catch (error: unknown) {
            if (error instanceof Error) {
                return thunkAPI.rejectWithValue(error.message);
            }
            return thunkAPI.rejectWithValue('Ошибка регистрации');
        }
    }
);

// 🔹 Получение текущего пользователя
export const fetchMe = createAsyncThunk(
    'auth/me',
    async (_, thunkAPI) => {
        try {
            // Проверяем наличие токена перед запросом
            const token = localStorage.getItem('token');
            if (!token) {
                return thunkAPI.rejectWithValue('Нет токена');
            }
            return await getMe();
        } catch (error: unknown) {
            if (error instanceof Error) {
                return thunkAPI.rejectWithValue(error.message);
            }
            return thunkAPI.rejectWithValue('Не удалось получить данные пользователя');
        }
    }
);

export const logoutUser = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
    try {
        await axiosInstance.post("/auth/logout"); // 🧠 Вызов сервера
        return;
    } catch (error: unknown) {
        if (error instanceof Error) {
            return thunkAPI.rejectWithValue(error.message);
        }
        return thunkAPI.rejectWithValue('Не удалось получить данные пользователя');
    }
});


const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
            })
            .addCase(loginUser.rejected, (state) => {
                state.loading = false;
            })

            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            .addCase(fetchMe.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMe.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isInitialized = true;
            })
            .addCase(fetchMe.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.isInitialized = true;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.isInitialized = true;
                // Удаляем токен из localStorage
                localStorage.removeItem('token');
            })
    },
});


export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuth = (state: RootState) => Boolean(state.auth.user);
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectIsInitialized = (state: RootState) => state.auth.isInitialized;

export default authSlice.reducer;
