// src/services/axios.ts
import axios from 'axios';

export const axiosInstance = axios.create({
    baseURL: '/api',
    withCredentials: true, // 💡 обязательно для отправки куков
    headers: {
        'Content-Type': 'application/json',
    },
});

// Добавляем токен к каждому запросу
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
