// src/pages/NotFound.tsx
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center">
            <h1 className="text-5xl font-bold text-red-600 mb-4">404</h1>
            <p className="text-xl mb-6">Страница не найдена</p>
            <Link to="/" className="text-blue-600 underline hover:text-blue-800">
                Вернуться на главную
            </Link>
        </div>
    );
};

export default NotFound;
