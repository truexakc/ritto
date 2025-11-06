import { FormEvent, useState } from 'react';
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loginUser } from "../store/slices/authSlice";
import { useNavigate, Link } from 'react-router-dom';

const LoginForm = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { loading } = useAppSelector((state) => state.auth);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState<string | null>(null); // Локальное состояние ошибки

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError(null); // очищаем предыдущую ошибку

        const result = await dispatch(loginUser({ email, password }));

        if (loginUser.fulfilled.match(result)) {
            navigate('/');
        } else {
            setFormError("Неверный email или пароль"); // скрываем техническую ошибку от пользователя
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-[#1F1F1F] rounded-2xl shadow-lg p-8 border border-[#2c2c2c]">
                <h2 className="text-3xl font-bold text-center text-white mb-8">Вход в аккаунт</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-md bg-[#2b2b2b] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e8262b]"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-md bg-[#2b2b2b] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e8262b]"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[#e8262b] hover:bg-[#d12026] text-white font-semibold rounded-full transition"
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>

                    {formError && (
                        <p className="text-sm text-red-500 text-center mt-2">{formError}</p>
                    )}
                </form>

                <p className="text-sm text-center text-gray-400 mt-6">
                    Нет аккаунта?{' '}
                    <Link to="/register" className="text-[#e8262b] hover:underline font-semibold">
                        Зарегистрироваться
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginForm;
