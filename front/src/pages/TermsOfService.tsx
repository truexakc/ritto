import { motion } from 'framer-motion';
import { FileText, CheckCircle, XCircle, AlertCircle, Scale } from 'lucide-react';

const TermsOfService = () => {
    const sections = [
        {
            icon: <CheckCircle className="w-6 h-6" />,
            title: "Принятие условий",
            content: "Используя наш веб-сайт и услуги, вы соглашаетесь с настоящими условиями использования. Если вы не согласны с какими-либо условиями, пожалуйста, не используйте наш сайт."
        },
        {
            icon: <FileText className="w-6 h-6" />,
            title: "Описание услуг",
            content: "SUSHIRITTO предоставляет услуги по онлайн-заказу и доставке суши, роллов и других блюд японской кухни. Мы стремимся обеспечить высокое качество продуктов и своевременную доставку."
        },
        {
            icon: <Scale className="w-6 h-6" />,
            title: "Регистрация и аккаунт",
            content: "Для оформления заказа вам необходимо создать учетную запись. Вы обязуетесь предоставить точную и актуальную информацию, а также обеспечить безопасность своего пароля."
        },
        {
            icon: <AlertCircle className="w-6 h-6" />,
            title: "Заказы и оплата",
            content: "Все цены указаны в рублях и включают НДС. Мы принимаем оплату онлайн и наличными при получении. Заказ считается подтвержденным после получения вами уведомления."
        },
        {
            icon: <XCircle className="w-6 h-6" />,
            title: "Отмена и возврат",
            content: "Вы можете отменить заказ до начала его приготовления. Возврат средств осуществляется в течение 5-7 рабочих дней. В случае проблем с качеством продукции, пожалуйста, свяжитесь с нами немедленно."
        }
    ];

    const rules = [
        "Не использовать сайт для незаконных целей",
        "Не пытаться получить несанкционированный доступ к системе",
        "Не размещать вредоносный контент или спам",
        "Уважать права интеллектуальной собственности",
        "Предоставлять достоверную информацию при регистрации"
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
                            <FileText className="w-10 h-10 text-[#f6eaea]" />
                        </motion.div>
                        <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-[#b12e2e] to-[#9a2525] bg-clip-text text-transparent mb-4">
                            Условия использования
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
                            Добро пожаловать в SUSHIRITTO! Настоящие условия использования регулируют ваш доступ 
                            к нашему веб-сайту и использование наших услуг. Пожалуйста, внимательно ознакомьтесь 
                            с этими условиями перед использованием сайта.
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

                    {/* Правила использования */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        className="bg-[#f6eaea]/5 backdrop-blur-sm rounded-3xl border border-[#f6eaea]/10 p-8 mt-8"
                    >
                        <h3 className="text-2xl font-bold text-[#E9E9E9] mb-6">
                            Правила использования
                        </h3>
                        <p className="text-[#ADADAD] leading-relaxed mb-6">
                            При использовании нашего сайта вы обязуетесь:
                        </p>
                        <ul className="space-y-3">
                            {rules.map((rule, index) => (
                                <motion.li
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: 0.9 + index * 0.05 }}
                                    className="flex items-start gap-3"
                                >
                                    <div className="w-6 h-6 bg-[#b12e2e]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <CheckCircle className="w-4 h-4 text-[#b12e2e]" />
                                    </div>
                                    <span className="text-[#ADADAD]">{rule}</span>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Доставка */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.1 }}
                        className="bg-[#f6eaea]/5 backdrop-blur-sm rounded-3xl border border-[#f6eaea]/10 p-8 mt-8"
                    >
                        <h3 className="text-2xl font-bold text-[#E9E9E9] mb-4">
                            Условия доставки
                        </h3>
                        <div className="space-y-4 text-[#ADADAD] leading-relaxed">
                            <p>
                                <span className="text-[#b12e2e] font-semibold">Время доставки:</span> Мы стремимся 
                                доставить ваш заказ в течение 60-90 минут. Точное время зависит от загруженности 
                                и вашего местоположения.
                            </p>
                            <p>
                                <span className="text-[#b12e2e] font-semibold">Зона доставки:</span> Мы осуществляем 
                                доставку в пределах указанной зоны. Минимальная сумма заказа может варьироваться 
                                в зависимости от района.
                            </p>
                            <p>
                                <span className="text-[#b12e2e] font-semibold">Ответственность:</span> Мы не несем 
                                ответственности за задержки, вызванные форс-мажорными обстоятельствами или 
                                предоставлением неверного адреса доставки.
                            </p>
                        </div>
                    </motion.div>

                    {/* Ограничение ответственности */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.2 }}
                        className="bg-[#f6eaea]/5 backdrop-blur-sm rounded-3xl border border-[#f6eaea]/10 p-8 mt-8"
                    >
                        <h3 className="text-2xl font-bold text-[#E9E9E9] mb-4">
                            Ограничение ответственности
                        </h3>
                        <p className="text-[#ADADAD] leading-relaxed">
                            SUSHIRITTO не несет ответственности за любые прямые, косвенные, случайные или 
                            последующие убытки, возникшие в результате использования или невозможности 
                            использования нашего сайта или услуг. Мы оставляем за собой право изменять 
                            или прекращать предоставление услуг в любое время без предварительного уведомления.
                        </p>
                    </motion.div>

                    {/* Изменения условий */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.3 }}
                        className="bg-gradient-to-r from-[#b12e2e]/10 to-[#9a2525]/10 backdrop-blur-sm rounded-3xl border border-[#b12e2e]/20 p-8 mt-8"
                    >
                        <h3 className="text-2xl font-bold text-[#E9E9E9] mb-4">
                            Изменения условий
                        </h3>
                        <p className="text-[#ADADAD] leading-relaxed mb-4">
                            Мы оставляем за собой право изменять настоящие условия использования в любое время. 
                            Изменения вступают в силу с момента их публикации на сайте. Продолжая использовать 
                            наш сайт после внесения изменений, вы соглашаетесь с обновленными условиями.
                        </p>
                        <div className="space-y-2">
                            <p className="text-[#E9E9E9]">
                                <span className="text-[#b12e2e] font-semibold">Контакты:</span>
                            </p>
                            <p className="text-[#E9E9E9]">Email: info@sushiritto.ru</p>
                            <p className="text-[#E9E9E9]">Телефон: +7 (963) 012-14-69</p>
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

export default TermsOfService;
