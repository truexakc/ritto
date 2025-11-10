import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
    fetchCart,
    addToCart,
    removeFromCart,
    selectCartItems,
    selectCartLoading,
    clearCartThunk,
} from "../store/slices/cartSlice";
import { Trash2, Plus, Minus, XCircle, ArrowLeft, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Basket = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const cartItems = useAppSelector(selectCartItems);
    const isLoading = useAppSelector(selectCartLoading);

    useEffect(() => {
        dispatch(fetchCart());
    }, [dispatch]);

    const totalPrice = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const handleIncrease = async (productId: string) => {
        await dispatch(addToCart({ productId, quantity: 1 }));
    };

    const handleDecrease = async (productId: string) => {
        await dispatch(removeFromCart(productId));
    };

    const handleClearCart = async () => {
        await dispatch(clearCartThunk());
    };

    const handleCheckout = () => {
        navigate("/checkout");
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, x: -100 }
    };

    return (
        <section className="relative py-20 lg:py-28 min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0c0c0c]">
            {/* Декоративные элементы */}
            <div className="absolute top-10 right-10 w-72 h-72 bg-[#b12e2e]/10 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#b12e2e]/5 rounded-full blur-3xl -z-10"></div>

            <div className="container mx-auto px-4">
                {/* Заголовок */}
                <motion.div
                    className="text-center mb-12 lg:mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-[#E9E9E9] text-4xl lg:text-6xl font-bold mb-4">
                        Моя <span className="text-[#b12e2e]">корзина</span>
                    </h2>
                    <p className="text-[#ADADAD] text-lg">
                        {cartItems.length > 0 
                            ? `У вас ${cartItems.length} товар${cartItems.length > 1 ? 'а' : ''} в корзине`
                            : 'Добавьте товары из нашего каталога'
                        }
                    </p>
                </motion.div>

                {/* Панель управления */}
                <motion.div
                    className="flex justify-between items-center mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <Link to="/catalog">
                        <motion.button
                            className="flex items-center gap-3 bg-[#f6eaea]/5 hover:bg-[#f6eaea]/10 text-[#E9E9E9] font-medium rounded-2xl px-6 py-3 border border-[#f6eaea]/10 transition-all duration-300 group"
                            whileHover={{ scale: 1.05, x: -5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            Вернуться к покупкам
                        </motion.button>
                    </Link>

                    {cartItems.length > 0 && (
                        <motion.button
                            onClick={handleClearCart}
                            className="flex items-center gap-3 text-[#ADADAD] hover:text-red-500 bg-[#f6eaea]/5 hover:bg-red-500/10 px-4 py-2 rounded-xl border border-[#f6eaea]/10 transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <XCircle size={18} />
                            Очистить корзину
                        </motion.button>
                    )}
                </motion.div>

                {/* Содержимое корзины */}
                {isLoading ? (
                    <motion.div
                        className="flex justify-center items-center py-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-[#b12e2e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-[#ADADAD]">Загрузка корзины...</p>
                        </div>
                    </motion.div>
                ) : cartItems.length === 0 ? (
                    <motion.div
                        className="text-center py-20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="w-24 h-24 bg-[#f6eaea]/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="w-12 h-12 text-[#b12e2e]" />
                        </div>
                        <h3 className="text-2xl text-[#E9E9E9] font-bold mb-4">Корзина пуста</h3>
                        <p className="text-[#ADADAD] mb-8 max-w-md mx-auto">
                            Добавьте вкуснейшие блюда из нашего каталога, чтобы сделать заказ
                        </p>
                        <Link to="/catalog">
                            <motion.button
                                className="bg-[#b12e2e] hover:bg-[#9a2525] text-[#f6eaea] font-bold rounded-2xl px-8 py-4 shadow-2xl hover:shadow-3xl transition-all duration-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Перейти в каталог
                            </motion.button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {cartItems.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className="group bg-[#f6eaea]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f6eaea]/10 hover:border-[#f6eaea]/20 transition-all duration-300"
                                >
                                    <div className="flex flex-col lg:flex-row items-center gap-6">
                                        {/* Изображение */}
                                        <motion.img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl object-cover shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                                            whileHover={{ scale: 1.05 }}
                                        />

                                        {/* Информация о товаре */}
                                        <div className="flex-1 text-center lg:text-left">
                                            <h3 className="text-xl font-bold text-[#E9E9E9] mb-2">
                                                {item.name}
                                            </h3>
                                            <p className="text-[#ADADAD] text-sm mb-3 line-clamp-2">
                                                {item.description}
                                            </p>
                                            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                                                <span className="bg-[#f6eaea]/5 px-3 py-1 rounded-full text-[#ADADAD] text-sm border border-[#f6eaea]/10">
                                                    {item.category}
                                                </span>
                                                <span className="text-[#b12e2e] font-bold text-lg">
                                                    {item.price} ₽/шт
                                                </span>
                                            </div>
                                        </div>

                                        {/* Управление количеством */}
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="flex items-center gap-3 bg-[#f6eaea]/5 rounded-2xl p-2 border border-[#f6eaea]/10">
                                                <motion.button
                                                    onClick={() => handleDecrease(item.productId)}
                                                    className="w-10 h-10 rounded-xl bg-[#f6eaea]/5 hover:bg-[#b12e2e] text-[#E9E9E9] hover:text-[#f6eaea] transition-all duration-200 flex items-center justify-center"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <Minus size={16} />
                                                </motion.button>
                                                <span className="text-[#b12e2e] font-bold text-lg min-w-8 text-center">
                                                    {item.quantity}
                                                </span>
                                                <motion.button
                                                    onClick={() => handleIncrease(item.productId)}
                                                    className="w-10 h-10 rounded-xl bg-[#f6eaea]/5 hover:bg-[#b12e2e] text-[#E9E9E9] hover:text-[#f6eaea] transition-all duration-200 flex items-center justify-center"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <Plus size={16} />
                                                </motion.button>
                                            </div>

                                            {/* Сумма и удаление */}
                                            <div className="text-center">
                                                <p className="text-[#E9E9E9] font-bold text-xl mb-2">
                                                    {item.price * item.quantity} ₽
                                                </p>
                                                <motion.button
                                                    onClick={() => handleDecrease(item.productId)}
                                                    className="flex items-center gap-2 text-[#ADADAD] hover:text-red-500 transition-colors duration-200 text-sm"
                                                    whileHover={{ scale: 1.05 }}
                                                >
                                                    <Trash2 size={16} />
                                                    Удалить
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Итоговая сумма и кнопка оформления */}
                {cartItems.length > 0 && (
                    <motion.div
                        className="mt-12 lg:mt-16"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        {/* Итоговая сумма */}
                        <div className="bg-gradient-to-r from-[#b12e2e] to-[#9a2525] rounded-2xl p-8 text-[#f6eaea] shadow-2xl mb-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-bold mb-2">Итоговая сумма</h3>
                                    <p className="text-[#f6eaea]/80">Доставка рассчитывается при оформлении</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl lg:text-4xl font-bold">{totalPrice} ₽</p>
                                    <p className="text-[#f6eaea]/80 text-sm mt-1">
                                        {cartItems.reduce((sum, item) => sum + item.quantity, 0)} товара
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Кнопка оформления */}
                        <div className="flex justify-center">
                            <motion.button
                                onClick={handleCheckout}
                                className="group bg-[#b12e2e] hover:bg-[#9a2525] text-[#f6eaea] text-xl font-bold rounded-2xl px-12 py-5 shadow-2xl hover:shadow-3xl transition-all duration-300 relative overflow-hidden"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f6eaea]/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                <span className="relative z-10 flex items-center gap-3">
                                    Оформить заказ
                                    <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default Basket;
