import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Mail } from 'lucide-react';

const PrivacyPolicy = () => {
    const sections = [
        {
            icon: <Database className="w-6 h-6" />,
            title: "Сбор информации",
            content: "Мы собираем информацию, которую вы предоставляете при регистрации, оформлении заказа или обращении в службу поддержки. Это может включать ваше имя, адрес электронной почты, номер телефона, адрес доставки и платежную информацию."
        },
        {
            icon: <Lock className="w-6 h-6" />,
            title: "Использование информации",
            content: "Мы используем собранную информацию для обработки ваших заказов, улучшения качества обслуживания, отправки уведомлений о статусе заказа и информирования о специальных предложениях (с вашего согласия)."
        },
        {
            icon: <Shield className="w-6 h-6" />,
            title: "Защита данных",
            content: "Мы применяем современные технологии шифрования и безопасности для защиты ваших персональных данных. Доступ к вашей информации имеют только уполномоченные сотрудники, которые обязаны соблюдать конфиденциальность."
        },
        {
            icon: <Eye className="w-6 h-6" />,
            title: "Передача третьим лицам",
            content: "Мы не продаем и не передаем ваши персональные данные третьим лицам, за исключением случаев, необходимых для выполнения заказа (например, службам доставки) или когда это требуется законом."
        },
        {
            icon: <Mail className="w-6 h-6" />,
            title: "Ваши права",
            content: "Вы имеете право запросить доступ к своим персональным данным, их исправление или удаление. Вы также можете отказаться от получения маркетинговых сообщений в любое время."
        }
    ];

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
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, type: "spring" }}
                            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#b12e2e] to-[#9a2525] rounded-full mb-6 shadow-2xl"
                        >
                            <Shield className="w-10 h-10 text-[#f6eaea]" />
                        </motion.div>
                        <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-[#b12e2e] to-[#9a2525] bg-clip-text text-transparent mb-4">
                            Политика конфиденциальности
                        </h1>
                        <p className="text-[#ADADAD] text-lg">
                            Последнее обновление: {new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    {/* Вступление */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-[#f6eaea]/5 backdrop-blur-sm rounded-3xl border border-[#f6eaea]/10 p-8 mb-8"
                    >
                        <p className="text-[#E9E9E9] text-lg leading-relaxed">
                            SUSHIRITTO уважает вашу конфиденциальность и стремится защитить ваши персональные данные. 
                            Эта политика конфиденциальности объясняет, как мы собираем, используем и защищаем вашу информацию 
                            при использовании нашего веб-сайта и услуг.
                        </p>
                    </motion.div>

                    {/* Секции */}
                    <div className="space-y-6">
                        {sections.map((section, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                                className="bg-[#f6eaea]/5 backdrop-blur-sm rounded-2xl border border-[#f6eaea]/10 p-6 hover:bg-[#f6eaea]/10 transition-all duration-300"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-[#b12e2e]/20 rounded-xl flex items-center justify-center text-[#b12e2e] flex-shrink-0">
                                        {section.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-[#E9E9E9] mb-3">
                                            {section.title}
                                        </h3>
                                        <p className="text-[#ADADAD] leading-relaxed">
                                            {section.content}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Cookies */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        className="bg-[#f6eaea]/5 backdrop-blur-sm rounded-3xl border border-[#f6eaea]/10 p-8 mt-8"
                    >
                        <h3 className="text-2xl font-bold text-[#E9E9E9] mb-4">
                            Использование файлов cookie
                        </h3>
                        <p className="text-[#ADADAD] leading-relaxed mb-4">
                            Мы используем файлы cookie для улучшения работы сайта, анализа трафика и персонализации контента. 
                            Файлы cookie - это небольшие текстовые файлы, которые сохраняются на вашем устройстве.
                        </p>
                        <p className="text-[#ADADAD] leading-relaxed">
                            Вы можете настроить свой браузер для отклонения файлов cookie, но это может ограничить 
                            функциональность сайта.
                        </p>
                    </motion.div>

                    {/* Контакты */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.9 }}
                        className="bg-gradient-to-r from-[#b12e2e]/10 to-[#9a2525]/10 backdrop-blur-sm rounded-3xl border border-[#b12e2e]/20 p-8 mt-8"
                    >
                        <h3 className="text-2xl font-bold text-[#E9E9E9] mb-4">
                            Свяжитесь с нами
                        </h3>
                        <p className="text-[#ADADAD] leading-relaxed mb-4">
                            Если у вас есть вопросы о нашей политике конфиденциальности или вы хотите воспользоваться 
                            своими правами в отношении персональных данных, пожалуйста, свяжитесь с нами:
                        </p>
                        <div className="space-y-2">
                            <p className="text-[#E9E9E9]">
                                <span className="text-[#b12e2e] font-semibold">Email:</span> info@sushiritto.ru
                            </p>
                            <p className="text-[#E9E9E9]">
                                <span className="text-[#b12e2e] font-semibold">Телефон:</span> +7 (963) 012-14-69
                            </p>
                            <p className="text-[#E9E9E9]">
                                <span className="text-[#b12e2e] font-semibold">Адрес:</span> д. Кондратово, ул. Камская 1Б
                            </p>
                        </div>
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

export default PrivacyPolicy;
