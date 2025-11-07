import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Calendar, ShoppingBag, DollarSign, LogOut, Shield } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectCurrentUser, logoutUser } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../services/axios';
import { getUserEmoji } from '../utils/emoji';
import { 
    colors, 
    borderRadius, 
    cardStyles,
    buttonStyles,
    badgeStyles,
    textStyles,
    decorativeStyles,
    containerStyles,
    avatarStyles,
    cn 
} from '../styles';

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
                <div className="text-white text-xl">Загрузка...</div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0c0c0c] flex items-center justify-center">
                <div className="text-white text-xl">Профиль не найден</div>
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
        <div className={cn("relative", containerStyles.page)}>
            {/* Декоративные элементы */}
            <div className={cn(decorativeStyles.blob.primary, "top-1/4 left-10")}></div>
            <div className={cn(decorativeStyles.blob.secondary, "bottom-1/4 right-10")}></div>

            <div className="relative z-10 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Заголовок */}
                    <div className="text-center mb-12">
                        <h1 className={cn(textStyles.h1, "mb-4")}>
                            Мой профиль
                        </h1>
                        <p className={cn(`text-[${colors.text.secondary}]`, "text-lg")}>
                            Управляйте своим аккаунтом и просматривайте статистику
                        </p>
                    </div>

                    {/* Основная карточка профиля */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={cn(cardStyles.base, "p-8 mb-6")}
                    >
                        {/* Аватар и основная информация */}
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                            <motion.div 
                                className={avatarStyles.large}
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                {getUserEmoji(profile.id)}
                            </motion.div>
                            
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                    <h2 className={textStyles.h2}>
                                        {profile.name || 'Пользователь'}
                                    </h2>
                                    {profile.isAdmin && (
                                        <span className={cn(badgeStyles.primary, "flex items-center gap-1")}>
                                            <Shield className="w-4 h-4" />
                                            Админ
                                        </span>
                                    )}
                                </div>
                                <div className={cn("flex items-center justify-center md:justify-start gap-2", `text-[${colors.text.secondary}]`, "mb-4")}>
                                    <Mail className="w-4 h-4" />
                                    <span>{profile.email}</span>
                                </div>
                                <div className={cn("flex items-center justify-center md:justify-start gap-2", `text-[${colors.text.secondary}]`)}>
                                    <Calendar className="w-4 h-4" />
                                    <span>Регистрация: {formatDate(profile.createdAt)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className={cn(
                                    "group bg-white/5 hover:bg-[#e8262b]/20",
                                    `text-[${colors.text.primary}] hover:text-[${colors.primary.main}]`,
                                    "font-medium", borderRadius.lg, "px-6 py-3",
                                    "border border-white/10 hover:border-[#e8262b]/50",
                                    "transition-all duration-300 flex items-center gap-2"
                                )}
                            >
                                <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                Выйти
                            </button>
                        </div>

                        {/* Статистика */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className={cn(cardStyles.base, "p-6")}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-14 h-14", `bg-[${colors.primary.main}]/20`, borderRadius.md, "flex items-center justify-center")}>
                                        <ShoppingBag className={cn("w-7 h-7", `text-[${colors.primary.main}]`)} />
                                    </div>
                                    <div>
                                        <p className={cn(`text-[${colors.text.secondary}]`, "text-sm mb-1")}>Всего заказов</p>
                                        <p className={cn("text-3xl font-bold", `text-[${colors.text.primary}]`)}>
                                            {profile.totalOrders}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className={cn(cardStyles.base, "p-6")}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-14 h-14", `bg-[${colors.primary.main}]/20`, borderRadius.md, "flex items-center justify-center")}>
                                        <DollarSign className={cn("w-7 h-7", `text-[${colors.primary.main}]`)} />
                                    </div>
                                    <div>
                                        <p className={cn(`text-[${colors.text.secondary}]`, "text-sm mb-1")}>Потрачено</p>
                                        <p className={cn("text-3xl font-bold", `text-[${colors.text.primary}]`)}>
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
                            className={buttonStyles.primary}
                        >
                            Перейти в каталог
                        </button>
                        
                        <button
                            onClick={() => navigate('/basket')}
                            className={buttonStyles.secondary}
                        >
                            Моя корзина
                        </button>
                    </motion.div>
                </motion.div>
            </div>

            {/* Декоративная сетка */}
            <div className={decorativeStyles.grid}>
                <div className={cn(decorativeStyles.gridLine.horizontal, "top-1/3")}></div>
                <div className={cn(decorativeStyles.gridLine.vertical, "left-1/3")}></div>
            </div>
        </div>
    );
};

export default Profile;
