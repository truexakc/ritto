import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { registerUser } from '../store/slices/authSlice';
import toast from "react-hot-toast";

const RegisterForm = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { loading } = useAppSelector((state) => state.auth);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState<string | null>(null); // локальная ошибка

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError(null); // сброс

        const result = await dispatch(registerUser({ name, email, password }));

        if (registerUser.fulfilled.match(result)) {
            toast.success("📧 Проверьте почту и подтвердите email");
            navigate("/login");
        } else {
            setFormError("Пользователь с таким email уже существует или произошла ошибка");
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-[#1F1F1F] rounded-2xl shadow-lg p-8 border border-[#2c2c2c]">
                <h2 className="text-3xl font-bold text-center text-white mb-8">Регистрация</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <input
                        type="text"
                        placeholder="Имя"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-md bg-[#2b2b2b] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e8262b]"
                        required
                    />
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
                        className="w-full py-3 bg-[#e8262b] hover:bg-[#d12026] text-white font-semibold rounded-full transition"
                        disabled={loading}
                    >
                        {loading ? 'Создание...' : 'Создать аккаунт'}
                    </button>

                    {formError && (
                        <p className="text-sm text-red-500 text-center mt-2">{formError}</p>
                    )}
                </form>

                <p className="text-sm text-center text-gray-400 mt-6">
                    Уже есть аккаунт?{' '}
                    <a href="/login" className="text-[#e8262b] hover:underline font-semibold">
                        Войти
                    </a>
                </p>
            </div>
        </div>
    );
};

export default RegisterForm;
