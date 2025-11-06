import { axiosInstance } from './axios';

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    name: string;
    email: string;
    password: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
}

export const login = async (credentials: LoginDto): Promise<{ token: string; user: User }> => {
    const res = await axiosInstance.post('/auth/login', credentials);
    return {
        token: res.data.token, // <-- переименовываем
        user: res.data.user
    };
};

export const register = async (payload: RegisterDto): Promise<{ token: string; user: User }> => {
    const res = await axiosInstance.post('/auth/register', payload);
    return {
        token: res.data.token,
        user: res.data.user
    };
};


export const getMe = async (): Promise<User> => {
    const res = await axiosInstance.get('/auth/me');
    console.log("📡 /auth/me response", res.data);
    return res.data.user; // <--- добавь `.user` если нужно
};


export const logout = async (): Promise<void> => {
    await axiosInstance.post('/auth/logout');
};
