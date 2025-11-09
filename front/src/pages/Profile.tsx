import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Calendar, ShoppingBag, DollarSign, LogOut, Shield } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectCurrentUser, logoutUser } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../services/axios';
import { getUserEmoji } from '../utils/emoji';

interface UserProfile {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
    createdAt: string;
    totalOrders: number;
    totalSpent: number;
}

const Profile = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const currentUser = useAppSelector(selectCurrentUser);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axiosInstance.get('/auth/profile');
                setProfile(response.data.user);
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchProfile();
        } else {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0c0c0c] flex items-center justify-center">
                <div className="text-[#f6eaea] text-xl">Загрузка...</div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0c0c0c] flex items-center justify-center">
                <div className="text-[#f6eaea] text-xl">Профиль не найден</div>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0c0c0c] overflow-hidden py-20 px-4">
            {/* Декоративные элементы */}
            <div className="absolute top-1/4 left-10 w-80 h-80 bg-[#b12e2e]/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#b12e2e]/5 rounded-full blur-3xl"></div>

            <div className="relative z-10 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Заголовок */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-[#b12e2e] to-[#9a2525] bg-clip-text text-transparent mb-4">
                            Мой профиль
                        </h1>
                        <p className="text-[#ADADAD] text-lg">
                            Управляйте своим аккаунтом и просматривайте статистику
                        </p>
                    </div>

                    {/* Основная карточка профиля */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-[#f6eaea]/5 backdrop-blur-sm rounded-3xl border border-[#f6eaea]/10 p-8 mb-6"
                    >
                        {/* Аватар и основная информация */}
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                            <motion.div 
                                className="w-24 h-24 bg-gradient-to-br from-[#b12e2e] to-[#9a2525] rounded-full flex items-center justify-center text-5xl shadow-2xl"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                {getUserEmoji(profile.id)}
                            </motion.div>
                            
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                    <h2 className="text-3xl font-bold text-[#E9E9E9]">
                                        {profile.name || 'Пользователь'}
                                    </h2>
                                    {profile.isAdmin && (
                                        <span className="bg-[#b12e2e]/20 text-[#b12e2e] px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                                            <Shield className="w-4 h-4" />
                                            Админ
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-center md:justify-start gap-2 text-[#ADADAD] mb-4">
                                    <Mail className="w-4 h-4" />
                                    <span>{profile.email}</span>
                                </div>
                                <div className="flex items-center justify-center md:justify-start gap-2 text-[#ADADAD]">
                                    <Calendar className="w-4 h-4" />
                                    <span>Регистрация: {formatDate(profile.createdAt)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="group bg-[#f6eaea]/5 hover:bg-[#b12e2e]/20 text-[#E9E9E9] hover:text-[#b12e2e] font-medium rounded-2xl px-6 py-3 border border-[#f6eaea]/10 hover:border-[#b12e2e]/50 transition-all duration-300 flex items-center gap-2"
                            >
                                <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                Выйти
                            </button>
                        </div>

                        {/* Статистика */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-[#f6eaea]/5 rounded-2xl p-6 border border-[#f6eaea]/10"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-[#b12e2e]/20 rounded-xl flex items-center justify-center">
                                        <ShoppingBag className="w-7 h-7 text-[#b12e2e]" />
                                    </div>
                                    <div>
                                        <p className="text-[#ADADAD] text-sm mb-1">Всего заказов</p>
                                        <p className="text-3xl font-bold text-[#E9E9E9]">
                                            {profile.totalOrders}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-[#f6eaea]/5 rounded-2xl p-6 border border-[#f6eaea]/10"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-[#b12e2e]/20 rounded-xl flex items-center justify-center">
                                        <DollarSign className="w-7 h-7 text-[#b12e2e]" />
                                    </div>
                                    <div>
                                        <p className="text-[#ADADAD] text-sm mb-1">Потрачено</p>
                                        <p className="text-3xl font-bold text-[#E9E9E9]">
                                            {profile.totalSpent.toLocaleString('ru-RU')} ₽
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Дополнительные действия */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        <button
                            onClick={() => navigate('/catalog')}
                            className="bg-[#b12e2e] hover:bg-[#9a2525] text-[#f6eaea] font-bold rounded-2xl px-8 py-4 shadow-2xl hover:shadow-3xl transition-all duration-300"
                        >
                            Перейти в каталог
                        </button>
                        
                        <button
                            onClick={() => navigate('/basket')}
                            className="bg-[#f6eaea]/5 hover:bg-[#f6eaea]/10 text-[#E9E9E9] font-medium rounded-2xl px-8 py-4 border border-[#f6eaea]/10 hover:border-[#f6eaea]/20 transition-all duration-300"
                        >
                            Моя корзина
                        </button>
                    </motion.div>
                </motion.div>
            </div>

            {/* Декоративная сетка */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#b12e2e] to-transparent w-full h-px top-1/3"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#b12e2e] to-transparent w-px h-full left-1/3"></div>
            </div>
        </div>
    );
};

export default Profile;
