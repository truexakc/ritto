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

    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [deliveryMethod, setDeliveryMethod] = useState("delivery");
    const [comment, setComment] = useState("");

    const [extraGinger, setExtraGinger] = useState(0);
    const [extraWasabi, setExtraWasabi] = useState(0);
    const [extraSoy, setExtraSoy] = useState(0);
    const [chopsticksCount, setChopsticksCount] = useState(0);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalPrice = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    useEffect(() => {
        dispatch(fetchCart());
    }, [dispatch]);

    const validatePhone = (value: string) => {
        const phoneRegex = /^(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/;
        return phoneRegex.test(value.trim());
    };

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
                products: cartItems.map((item) => ({
                    id: item.productId,
                    quantity: item.quantity,
                })),
                shipping_address: address.trim(),
                phone_number: phone.trim(),
                total_price: totalPrice,
                payment_method: paymentMethod,
                delivery_method: deliveryMethod,
                comment: comment.trim(),
                extra_ginger: !!extraGinger,
                extra_wasabi: !!extraWasabi,
                extra_soy_sauce: !!extraSoy,
                chopsticks_count: chopsticksCount,
            };


            const response = await axiosInstance.post("/orders", orderData);

            if (response.status === 201) {
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
            <section className="min-h-screen flex items-center justify-center bg-[#0C0C0C] text-white">
                Загрузка корзины...
            </section>
        );
    }

    if (cartItems.length === 0) {
        return (
            <section className="min-h-screen flex items-center justify-center bg-[#0C0C0C] text-white">
                Корзина пуста. Добавьте товары для оформления заказа.
            </section>
        );
    }
    return (
        <section className="py-12 px-4 bg-[#0C0C0C] min-h-screen text-white">
            <div className="max-w-xl mx-auto">
                <h2 className="text-3xl font-bold mb-6 text-center">Оформление заказа</h2>

                {error && <div className="mb-4 text-red-500">{error}</div>}
                {success && <div className="mb-4 text-green-500">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Phone */}
                    <div>
                        <label className="block mb-1 text-sm">Номер телефона *</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-2 bg-[#1C1C1C] border border-gray-700 rounded focus:outline-none"
                            placeholder="+7 999 123-45-67"
                            required
                            autoComplete="tel"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Delivery */}
                    <div>
                        <label className="block mb-1 text-sm">Способ получения</label>
                        <select
                            value={deliveryMethod}
                            onChange={(e) => setDeliveryMethod(e.target.value)}
                            className="w-full px-4 py-2 bg-[#1C1C1C] border border-gray-700 rounded"
                            disabled={isSubmitting}
                        >
                            <option value="delivery">Доставка</option>
                            <option value="pickup">Самовывоз</option>
                        </select>
                    </div>

                    {deliveryMethod === "delivery" && (
                        <div>
                            <label className="block mb-1 text-sm">Адрес доставки *</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full px-4 py-2 bg-[#1C1C1C] border border-gray-700 rounded"
                                placeholder="Улица, дом, квартира"
                                required
                                autoComplete="street-address"
                                disabled={isSubmitting}
                            />
                        </div>
                    )}

                    {/* Payment */}
                    <div>
                        <label className="block mb-1 text-sm">Способ оплаты</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-4 py-2 bg-[#1C1C1C] border border-gray-700 rounded"
                            disabled={isSubmitting}
                        >
                            <option value="card">Картой</option>
                            <option value="cash">Наличными</option>
                        </select>
                    </div>

                    {/* Extras */}
                    <div>
                        <label className="block mb-2 text-sm">Дополнительно:</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm block">Имбирь (шт.)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={extraGinger}
                                    onChange={(e) => setExtraGinger(Number(e.target.value))}
                                    className="w-full px-3 py-1 bg-[#1C1C1C] border border-gray-700 rounded"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="text-sm block">Васаби (шт.)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={extraWasabi}
                                    onChange={(e) => setExtraWasabi(Number(e.target.value))}
                                    className="w-full px-3 py-1 bg-[#1C1C1C] border border-gray-700 rounded"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="text-sm block">Соевый соус (шт.)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={extraSoy}
                                    onChange={(e) => setExtraSoy(Number(e.target.value))}
                                    className="w-full px-3 py-1 bg-[#1C1C1C] border border-gray-700 rounded"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="text-sm block">Палочки (пар)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={chopsticksCount}
                                    onChange={(e) => setChopsticksCount(Number(e.target.value))}
                                    className="w-full px-3 py-1 bg-[#1C1C1C] border border-gray-700 rounded"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block mb-1 text-sm">Комментарий</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 bg-[#1C1C1C] border border-gray-700 rounded"
                            placeholder="Например: без лука, звоните заранее..."
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center font-bold text-lg text-[#b12e2e]">
                        <span>Сумма заказа:</span>
                        <span>{totalPrice} ₽</span>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className={`w-full py-3 rounded-full font-bold text-lg transition ${
                            isSubmitting
                                ? "bg-gray-500 cursor-not-allowed"
                                : "bg-[#b12e2e] hover:bg-[#9a2525] text-white"
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
