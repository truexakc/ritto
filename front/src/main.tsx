// src/main.tsx
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import App from './App';
import {AppProvider} from './providers/AppProvider';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';

import Home from './pages/Home';
import Catalog from './pages/Catalog';
import BasketList from './pages/BasketList';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import NotFound from './pages/NotFound'; // 🆕
import PrivateRoute from './routes/PrivateRoute';
import 'leaflet/dist/leaflet.css';
import {PersistGate} from "redux-persist/integration/react";
import {persistor} from "./store/store.ts";
import Checkout from "./pages/Checkout.tsx";


const router = createBrowserRouter([
    {
        path: '/',
        element: <App/>,
        children: [
            {index: true, element: <Home/>},
            {path: 'catalog', element: <Catalog/>},
            {path: 'basket', element: <BasketList/>},
            {path: 'login', element: <LoginForm/>},
            {path: 'register', element: <RegisterForm/>},
            {
                path: 'checkout',
                element: <Checkout />
            },

            {
                element: <PrivateRoute/>,
                children: [
                    // Приватные страницы можно будет добавить сюда
                ],
            },

            {path: '*', element: <NotFound/>},
        ],
    },
]);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AppProvider>
            <PersistGate loading={null} persistor={persistor}>
                <RouterProvider router={router}/>
            </PersistGate>
        </AppProvider>
    </StrictMode>
);
