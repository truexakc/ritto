import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
    clearCartThunk,
    fetchCart,
    selectCartItems,
    selectCartLoading,
} from "../store/slices/cartSlice";
import { axiosInstance } from "../services/axios";

const Checkout = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const cartItems = useAppSelector(selectCartItems);
    const isLoading = useAppSelector(selectCartLoading);

    const [name, setName] = useState(() => localStorage.getItem("checkout_name") || "");
    const [address, setAddress] = useState(() => localStorage.getItem("checkout_address") || "");
    const [phone, setPhone] = useState(() => localStorage.getItem("checkout_phone") || "");
    const [paymentMethod, setPaymentMethod] = useState(() => localStorage.getItem("checkout_payment") || "card");
    const [deliveryMethod, setDeliveryMethod] = useState(() => localStorage.getItem("checkout_delivery") || "delivery");
    const [comment, setComment] = useState("");

    const [extraGinger, setExtraGinger] = useState(0);
    const [extraWasabi, setExtraWasabi] = useState(0);
    const [extraSoy, setExtraSoy] = useState(0);
    const [chopsticksCount, setChopsticksCount] = useState(0);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Сохранение данных в localStorage при изменении
    useEffect(() => {
        localStorage.setItem("checkout_name", name);
    }, [name]);

    useEffect(() => {
        localStorage.setItem("checkout_address", address);
    }, [address]);

    useEffect(() => {
        localStorage.setItem("checkout_phone", phone);
    }, [phone]);

    useEffect(() => {
        localStorage.setItem("checkout_payment", paymentMethod);
    }, [paymentMethod]);

    useEffect(() => {
        localStorage.setItem("checkout_delivery", deliveryMethod);
    }, [deliveryMethod]);

    const totalPrice = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    useEffect(() => {
        dispatch(fetchCart());
    }, [dispatch]);

    const validatePhone = (value: string) => {
        const phoneRegex = /^(\+?7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/;
        return phoneRegex.test(value.trim());
    };

    const validateName = (value: string) => value.trim().length >= 2;

    const validateAddress = (value: string) => value.trim().length >= 5;

    const validateExtras = (...values: number[]) =>
        values.every((val) => Number.isInteger(val) && val >= 0 && val <= 10);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (isSubmitting) return;

        if (cartItems.length === 0 || totalPrice === 0) {
            return setError("Корзина пуста.");
        }

        if (!validateName(name)) {
            return setError("Введите ваше имя (минимум 2 символа).");
        }

        if (!validatePhone(phone)) {
            return setError("Введите корректный номер телефона.");
        }

        if (deliveryMethod === "delivery" && !validateAddress(address)) {
            return setError("Введите корректный адрес доставки.");
        }

        if (
            !validateExtras(
                extraGinger,
                extraWasabi,
                extraSoy,
                chopsticksCount
            )
        ) {
            return setError("Допы должны быть от 0 до 10.");
        }

        setIsSubmitting(true);

        try {
            const orderData = {
                customer_name: name.trim(),
                products: cartItems.map((item) => ({
                    id: item.productId,
                    name: item.name,
                    quantity: item.quantity,
                })),
                shipping_address: address.trim(),
                phone_number: phone.trim(),
                total_price: totalPrice,
                payment_method: paymentMethod,
                delivery_method: deliveryMethod,
                comment: comment.trim(),
                extra_ginger_count: extraGinger,
                extra_wasabi_count: extraWasabi,
                extra_soy_sauce_count: extraSoy,
                chopsticks_count: chopsticksCount,
            };


            const response = await axiosInstance.post("/telegram/order", orderData);

            if (response.status === 200 || response.status === 201) {
                setSuccess("✅ Заказ успешно оформлен!");
                setTimeout(() => {
                    dispatch(clearCartThunk());
                    navigate("/");
                }, 2000);
            } else {
                throw new Error("Ошибка запроса");
            }
        } catch (err) {
            console.error(err);
            setError("❌ Ошибка при оформлении заказа. Попробуйте позже.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0c0c0c] text-[#f6eaea] overflow-hidden">
                <div className="absolute top-10 right-10 w-72 h-72 bg-[#b12e2e]/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#b12e2e]/5 rounded-full blur-3xl"></div>
                <div className="relative z-10">Загрузка корзины...</div>
            </section>
        );
    }

    if (cartItems.length === 0) {
        return (
            <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0c0c0c] text-[#f6eaea] overflow-hidden">
                <div className="absolute top-10 right-10 w-72 h-72 bg-[#b12e2e]/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#b12e2e]/5 rounded-full blur-3xl"></div>
                <div className="relative z-10">Корзина пуста. Добавьте товары для оформления заказа.</div>
            </section>
        );
    }
    return (
        <section className="relative pt-28 lg:pt-32 pb-12 px-4 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0c0c0c] min-h-screen text-[#f6eaea] overflow-hidden">
            {/* Декоративные элементы */}
            <div className="absolute top-10 right-10 w-72 h-72 bg-[#b12e2e]/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#b12e2e]/5 rounded-full blur-3xl"></div>
            
            <div className="max-w-xl mx-auto relative z-10">
                <h2 className="text-[#b12e2e] font-bold text-4xl lg:text-5xl mb-8">ОФОРМЛЕНИЕ ЗАКАЗА</h2>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 bg-[#f6eaea]/5 backdrop-blur-sm border border-[#f6eaea]/10 rounded-2xl p-6 lg:p-8">
                    {/* Name */}
                    <div>
                        <label className="block mb-2 text-sm text-[#E9E9E9] font-semibold">Ваше имя *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-[#f6eaea]/5 border border-[#f6eaea]/20 rounded-xl focus:outline-none focus:border-[#b12e2e] transition-colors text-[#f6eaea]"
                            placeholder="Иван"
                            required
                            autoComplete="name"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block mb-2 text-sm text-[#E9E9E9] font-semibold">Номер телефона *</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 bg-[#f6eaea]/5 border border-[#f6eaea]/20 rounded-xl focus:outline-none focus:border-[#b12e2e] transition-colors text-[#f6eaea]"
                            placeholder="+7 999 123-45-67"
                            required
                            autoComplete="tel"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Delivery */}
                    <div>
                        <label className="block mb-2 text-sm text-[#E9E9E9] font-semibold">Способ получения</label>
                        <select
                            value={deliveryMethod}
                            onChange={(e) => setDeliveryMethod(e.target.value)}
                            className="w-full px-4 py-3 bg-[#f6eaea]/5 border border-[#f6eaea]/20 rounded-xl focus:outline-none focus:border-[#b12e2e] transition-colors text-[#f6eaea]"
                            disabled={isSubmitting}
                        >
                            <option value="delivery" className="bg-[#1a1a1a]">Доставка</option>
                            <option value="pickup" className="bg-[#1a1a1a]">Самовывоз</option>
                        </select>
                    </div>

                    {deliveryMethod === "delivery" && (
                        <div>
                            <label className="block mb-2 text-sm text-[#E9E9E9] font-semibold">Адрес доставки *</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full px-4 py-3 bg-[#f6eaea]/5 border border-[#f6eaea]/20 rounded-xl focus:outline-none focus:border-[#b12e2e] transition-colors text-[#f6eaea]"
                                placeholder="Улица, дом, квартира"
                                required
                                autoComplete="street-address"
                                disabled={isSubmitting}
                            />
                        </div>
                    )}

                    {/* Payment */}
                    <div>
                        <label className="block mb-2 text-sm text-[#E9E9E9] font-semibold">Способ оплаты</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-4 py-3 bg-[#f6eaea]/5 border border-[#f6eaea]/20 rounded-xl focus:outline-none focus:border-[#b12e2e] transition-colors text-[#f6eaea]"
                            disabled={isSubmitting}
                        >
                            <option value="card" className="bg-[#1a1a1a]">Картой</option>
                            <option value="cash" className="bg-[#1a1a1a]">Наличными</option>
                        </select>
                    </div>

                    {/* Extras */}
                    <div>
                        <label className="block mb-3 text-sm text-[#E9E9E9] font-semibold">Дополнительно:</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm block text-[#ADADAD] mb-1">Имбирь (шт.)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={extraGinger}
                                    onChange={(e) => setExtraGinger(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-[#f6eaea]/5 border border-[#f6eaea]/20 rounded-xl focus:outline-none focus:border-[#b12e2e] transition-colors text-[#f6eaea]"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="text-sm block text-[#ADADAD] mb-1">Васаби (шт.)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={extraWasabi}
                                    onChange={(e) => setExtraWasabi(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-[#f6eaea]/5 border border-[#f6eaea]/20 rounded-xl focus:outline-none focus:border-[#b12e2e] transition-colors text-[#f6eaea]"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="text-sm block text-[#ADADAD] mb-1">Соевый соус (шт.)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={extraSoy}
                                    onChange={(e) => setExtraSoy(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-[#f6eaea]/5 border border-[#f6eaea]/20 rounded-xl focus:outline-none focus:border-[#b12e2e] transition-colors text-[#f6eaea]"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="text-sm block text-[#ADADAD] mb-1">Палочки (пар)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={chopsticksCount}
                                    onChange={(e) => setChopsticksCount(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-[#f6eaea]/5 border border-[#f6eaea]/20 rounded-xl focus:outline-none focus:border-[#b12e2e] transition-colors text-[#f6eaea]"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block mb-2 text-sm text-[#E9E9E9] font-semibold">Комментарий</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-[#f6eaea]/5 border border-[#f6eaea]/20 rounded-xl focus:outline-none focus:border-[#b12e2e] transition-colors text-[#f6eaea] resize-none"
                            placeholder="Например: без лука, звоните заранее..."
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center font-bold text-xl text-[#b12e2e] pt-4 border-t border-[#f6eaea]/10">
                        <span>Сумма заказа:</span>
                        <span>{totalPrice} ₽</span>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${
                            isSubmitting
                                ? "bg-gray-500 cursor-not-allowed"
                                : "bg-[#b12e2e] hover:bg-[#9a2525] text-[#f6eaea] hover:shadow-xl hover:scale-[1.02]"
                        }`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Отправка..." : "Подтвердить заказ"}
                    </button>
                </form>
            </div>
        </section>
    );

};

export default Checkout;
