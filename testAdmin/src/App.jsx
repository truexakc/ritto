

import { Admin, Resource } from 'react-admin';
import { useEffect, useState } from 'react';
import dataProvider from './dataProvider';
import { OrderList, OrderShow } from './orders';
import {OrderItemsList} from "./orderItems.jsx";

export default function App() {
    const [isAdmin, setIsAdmin] = useState(null);

    useEffect(() => {
        const checkAdmin = async () => {
            const token = localStorage.getItem('token');
            if (!token) return setIsAdmin(false);

            try {
                const res = await fetch('http://localhost:5000/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error();

                const user = await res.json();
                setIsAdmin(user.isAdmin === true);
            } catch {
                setIsAdmin(false);
            }
        };

        checkAdmin();
    }, []);

    if (isAdmin === null) return <div>Загрузка...</div>;
    if (isAdmin === false) return <div>Доступ запрещён</div>;

    return (
        <Admin dataProvider={dataProvider}>
            <Resource name="orders" list={OrderList} show={OrderShow} />
            <Resource name="order_items" list={OrderItemsList} />
        </Admin>

    );
}
