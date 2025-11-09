import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Проверяем, было ли уже принято согласие
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            // Показываем модалку через небольшую задержку
            setTimeout(() => setIsVisible(true), 1000);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'accepted');
        setIsVisible(false);
    };

    const handleClose = () => {
        localStorage.setItem('cookieConsent', 'dismissed');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[101] w-[95%] max-w-lg"
                    >
                        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#242424] rounded-3xl border border-[#f6eaea]/20 shadow-2xl p-6 relative overflow-hidden">
                            {/* Декоративные элементы */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#b12e2e]/10 rounded-full blur-2xl"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#b12e2e]/5 rounded-full blur-xl"></div>

                            {/* Кнопка закрытия */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[#f6eaea]/10 transition-colors duration-200 text-[#ADADAD] hover:text-[#f6eaea]"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Контент */}
                            <div className="relative z-10">
                                <div className="flex items-start gap-4 mb-4">
                                    {/* Эмодзи ролла */}
                                    <motion.div
                                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                        className="text-5xl flex-shrink-0"
                                    >
                                        🍣
                                    </motion.div>

                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-[#E9E9E9] mb-2">
                                            Мы используем cookies
                                        </h3>
                                        <p className="text-[#ADADAD] text-sm leading-relaxed">
                                            Этот сайт использует файлы cookie для улучшения вашего опыта, 
                                            анализа трафика и персонализации контента. Продолжая использовать 
                                            сайт, вы соглашаетесь с нашей{' '}
                                            <a 
                                                href="/privacy-policy" 
                                                className="text-[#b12e2e] hover:text-[#9a2525] underline transition-colors"
                                            >
                                                политикой конфиденциальности
                                            </a>.
                                        </p>
                                    </div>
                                </div>

                                {/* Кнопки */}
                                <div className="flex gap-3 mt-6">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleAccept}
                                        className="flex-1 bg-[#b12e2e] hover:bg-[#9a2525] text-[#f6eaea] font-semibold rounded-xl px-6 py-3 transition-colors duration-200 shadow-lg"
                                    >
                                        Принять
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleClose}
                                        className="px-6 py-3 bg-[#f6eaea]/5 hover:bg-[#f6eaea]/10 text-[#ADADAD] hover:text-[#f6eaea] font-medium rounded-xl border border-[#f6eaea]/10 transition-all duration-200"
                                    >
                                        Закрыть
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CookieConsent;
