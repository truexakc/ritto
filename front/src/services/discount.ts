// services/discount.ts
import { axiosInstance } from './axios';
import { Discount } from '../types/Discount';

export const getActiveDiscount = async (): Promise<Discount> => {
    const response = await axiosInstance.get('/discounts/active');
    return response.data;
};
