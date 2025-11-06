// src/services/auth.ts
import { axiosInstance } from './axios';

export const login = async (credentials: { email: string; password: string }) => {
    const res = await axiosInstance.post('/auth/login', credentials);
    return res.data;
};

export const register = async (payload: {
    name: string;
    email: string;
    password: string;
}) => {
    const res = await axiosInstance.post('/auth/register', payload);
    return res.data;
};

export const getMe = async () => {
    const res = await axiosInstance.get('/auth/me');
    return res.data;
};
