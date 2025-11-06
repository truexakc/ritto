// src/routes/PrivateRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectIsAuth } from '../store/slices/authSlice';

const PrivateRoute = () => {
    const isAuth = useAppSelector(selectIsAuth);

    return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
