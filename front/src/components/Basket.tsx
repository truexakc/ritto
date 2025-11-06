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
import { Trash2, Plus, Minus, XCircle } from "lucide-react";

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
        dispatch(fetchCart());
    };

    const handleDecrease = async (productId: string) => {
        await dispatch(removeFromCart(productId));
        dispatch(fetchCart());
    };

    const handleClearCart = async () => {
        await dispatch(clearCartThunk());
        dispatch(fetchCart());
    };

    const handleCheckout = () => {
        navigate("/checkout");
    };

    return (
        <section className="py-12 bg-[#0C0C0C] min-h-screen">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-[#E9E9E9] text-4xl lg:text-6xl font-bold">
                        Моя <span className="text-[#e8262b]">корзина</span>
                    </h2>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <Link to="/">
                        <button className="bg-[#e8262b] hover:bg-[#d12026] text-white font-medium rounded-full px-6 py-2">
                            ← Назад
                        </button>
                    </Link>

                    {cartItems.length > 0 && (
                        <button
                            onClick={handleClearCart}
                            className="flex items-center gap-2 text-red-500 hover:text-red-600"
                        >
                            <XCircle size={20} />
                            Очистить корзину
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <p className="text-white text-center">Загрузка корзины...</p>
                ) : cartItems.length === 0 ? (
                    <p className="text-gray-400 text-center mt-20">
                        Ваша корзина пуста. Добавьте товары из каталога.
                    </p>
                ) : (
                    <div className="space-y-6">
                        {cartItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-col lg:flex-row items-center gap-6 bg-[#1C1C1C] rounded-lg p-6 shadow-md"
                            >
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full max-w-[120px] rounded-lg"
                                />
                                <div className="flex flex-col flex-grow text-white">
                                    <h3 className="text-xl font-bold">{item.name}</h3>
                                    <p className="text-sm text-gray-400">{item.description}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Категория: <span className="text-[#e8262b]">{item.category}</span>
                                    </p>

                                    <div className="flex items-center gap-3 mt-3">
                                        <button
                                            onClick={() => handleDecrease(item.productId)}
                                            className="bg-gray-700 px-3 py-1 rounded-full hover:bg-gray-600"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="text-[#e8262b] font-bold">{item.quantity}</span>
                                        <button
                                            onClick={() => handleIncrease(item.productId)}
                                            className="bg-gray-700 px-3 py-1 rounded-full hover:bg-gray-600"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>

                                    <div className="mt-3">
                                        <p className="text-sm text-gray-400">
                                            Цена за 1 шт: <span className="text-white">{item.price} ₽</span>
                                        </p>
                                        <p className="text-md font-bold text-[#e8262b]">
                                            Всего: {item.price * item.quantity} ₽
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDecrease(item.productId)}
                                    className="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full"
                                >
                                    <Trash2 size={18} className="inline mr-1" />
                                    Удалить
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {cartItems.length > 0 && (
                    <>
                        <div className="mt-12 bg-[#e8262b] rounded-lg px-8 py-6 text-[#171717] text-xl font-bold shadow-md flex justify-between items-center">
                            <span>Итоговая сумма:</span>
                            <span>{totalPrice} ₽</span>
                        </div>

                        <div className="flex justify-center mt-10">
                            <button
                                onClick={handleCheckout}
                                className="bg-[#e8262b] hover:bg-[#d12026] text-white text-lg font-bold rounded-full px-10 py-4 shadow-md"
                            >
                                Оформить заказ
                            </button>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default Basket;
