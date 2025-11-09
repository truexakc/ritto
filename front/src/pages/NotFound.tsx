import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="relative min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0c0c0c] overflow-hidden">
            {/* Декоративные элементы */}
            <div className="absolute top-1/4 left-10 w-80 h-80 bg-[#b12e2e]/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#b12e2e]/5 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#b12e2e]/10 rounded-full blur-2xl"></div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-2xl mx-auto"
                >
                    {/* Анимированное число 404 */}
                    <motion.div
                        className="relative mb-8"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <h1 className="text-8xl lg:text-9xl font-black bg-gradient-to-r from-[#b12e2e] to-[#9a2525] bg-clip-text text-transparent">
                            404
                        </h1>
                        
                        {/* Декоративные элементы вокруг числа */}
                        <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#b12e2e] rounded-full opacity-20"></div>
                        <div className="absolute -bottom-2 -left-4 w-6 h-6 bg-[#b12e2e] rounded-full opacity-30"></div>
                        <div className="absolute top-1/2 -right-8 w-4 h-4 bg-[#b12e2e] rounded-full opacity-40"></div>
                    </motion.div>

                    {/* Основной текст */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl lg:text-3xl font-bold text-[#E9E9E9] mb-4">
                            Ой! Страница не найдена
                        </h2>
                        <p className="text-lg lg:text-xl text-[#ADADAD] mb-6 max-w-md mx-auto">
                            Возможно, эта страница была перемещена или удалена. 
                            Давайте вернем вас на верный путь.
                        </p>
                    </motion.div>

                    {/* Иконка поиска */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="mb-8"
                    >
                        <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
                            <Search className="w-10 h-10 text-[#b12e2e]" />
                        </div>
                    </motion.div>

                    {/* Кнопки действий */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <Link to="/">
                            <motion.button
                                className="group bg-[#b12e2e] hover:bg-[#9a2525] text-white font-bold rounded-2xl px-8 py-4 shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-3"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                На главную страницу
                            </motion.button>
                        </Link>

                        <button
                            onClick={() => window.history.back()}
                            className="group bg-white/5 hover:bg-white/10 text-[#E9E9E9] font-medium rounded-2xl px-8 py-4 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-3"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            Вернуться назад
                        </button>
                    </motion.div>

                    {/* Дополнительная информация */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1 }}
                        className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm max-w-md mx-auto"
                    >
                        <h3 className="text-[#E9E9E9] font-semibold mb-2">Нужна помощь?</h3>
                        <p className="text-[#ADADAD] text-sm mb-4">
                            Если вы считаете, что это ошибка, свяжитесь с нашей службой поддержки.
                        </p>
                        <div className="flex justify-center gap-4">
                            <a 
                                href="tel:+79000000000" 
                                className="text-[#b12e2e] hover:text-[#9a2525] text-sm font-medium transition-colors"
                            >
                                +7 (900) 000-00-00
                            </a>
                            <span className="text-[#ADADAD]">•</span>
                            <a 
                                href="mailto:support@pizzeria.ru" 
                                className="text-[#b12e2e] hover:text-[#9a2525] text-sm font-medium transition-colors"
                            >
                                support@pizzeria.ru
                            </a>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Анимированные частицы */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-[#b12e2e] rounded-full opacity-20"
                            initial={{
                                x: Math.random() * window.innerWidth,
                                y: Math.random() * window.innerHeight,
                            }}
                            animate={{
                                y: [0, -30, 0],
                                opacity: [0.2, 0.5, 0.2],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Декоративная сетка */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#b12e2e] to-transparent w-full h-px top-1/3"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#b12e2e] to-transparent w-px h-full left-1/3"></div>
            </div>
        </div>
    );
};

export default NotFound;
