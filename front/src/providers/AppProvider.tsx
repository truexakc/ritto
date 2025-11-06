// src/providers/AppProvider.tsx
import { ReactNode } from 'react';
import { StoreProvider } from './StoreProvider';
import { QueryProvider } from './QueryProvider';

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
    return (
        <StoreProvider>
            <QueryProvider>{children}</QueryProvider>
        </StoreProvider>
    );
};
