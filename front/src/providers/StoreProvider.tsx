// src/providers/StoreProvider.tsx
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store/store';

interface StoreProviderProps {
    children: ReactNode;
}

export const StoreProvider = ({ children }: StoreProviderProps) => {
    return <Provider store={store}>{children}</Provider>;
};
