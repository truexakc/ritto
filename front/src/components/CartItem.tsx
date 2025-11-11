import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import MoreAbout from "./MoreAbout";
import { Product } from "../types/Product";
import { useAppDispatch } from "../store/hooks";
import { addToCart  } from "../store/slices/cartSlice";
import { ShoppingCart, CheckCircle2 } from "lucide-react";
import AuthModal from "./AuthModal.tsx";

interface Props {
    product: Product;
}

const CartItem = ({ product }: Props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [showAddedPopup, setShowAddedPopup] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    const dispatch = useAppDispatch();

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleOpenModal = () => {
        setIsModalOpen(true);
        setIsClosing(false);
    };

    const handleCloseModal = () => {
        setIsClosing(true);
        setTimeout(() => setIsModalOpen(false), 300);
    };

    const handleAddToCart = async () => {
        try {
            const result = await dispatch(addToCart({ productId: product.id, quantity: 1 }));

            if (addToCart.rejected.match(result)) {
                if (result.payload === "Войдите в аккаунт, чтобы добавить товар" || result.payload?.includes("Не авторизован")) {
                    setShowAuthModal(true);
                }
            } else {
                setShowAddedPopup(true);
                setTimeout(() => setShowAddedPopup(false), 1500);
            }
        } catch (err) {
            if (import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true') {
                console.error("Ошибка при добавлении:", err);
            }
        }
    };


    if (!product?.name) {
        return <div className="text-red-500">Ошибка загрузки продукта</div>;
    }

    return (
        <div className="flex flex-col bg-[#f6eaea]/5 backdrop-blur-sm border border-[#f6eaea]/10 h-[500px] overflow-hidden relative rounded-2xl group">
            {/* Анимированный фон при ховере */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#b12e2e]/0 to-[#b12e2e]/0 group-hover:from-[#b12e2e]/10 group-hover:to-[#b12e2e]/5 transition-all duration-700 ease-out rounded-2xl"></div>
            <div className="absolute inset-0 border border-[#f6eaea]/10 group-hover:border-[#b12e2e]/30 transition-all duration-700 ease-out rounded-2xl"></div>
            
            {/* Контент */}
            <div className="relative z-10 flex flex-col h-full">
            {/* Картинка */}
            <div className="h-56 w-full overflow-hidden">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-[#f6eaea]/5 flex items-center justify-center text-[#ADADAD]">
                        Нет изображения
                    </div>
                )}
            </div>

            {/* Контент */}
            <div className="flex flex-col justify-between flex-grow p-4">
                <div>
                    <p className="text-[#b12e2e] font-bold text-lg">{product.name}</p>
                    <p className="text-[#ADADAD] text-sm mt-2 line-clamp-3">
                        {product.description}
                    </p>
                </div>

                <div className="mt-4">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-xl text-[#b12e2e]">{product.price} ₽</span>
                    </div>

                    <div className="flex justify-between mt-4 gap-2 relative">
                        {/* Кнопка подробнее */}
                        <button
                            onClick={handleOpenModal}
                            className="flex-1 text-[#f6eaea] py-2 px-3 sm:px-4 text-sm sm:text-base bg-black hover:-translate-y-1 transition-transform rounded-full"
                        >
                            Подробнее
                        </button>

                        {/* Кнопка добавления */}
                        <button
                            onClick={handleAddToCart}
                            className="bg-black hover:bg-[#f0f0f0] rounded-full p-1.5 sm:p-2 shadow-md transition-all flex items-center justify-center"
                            title="Добавить в корзину"
                        >
                            <ShoppingCart className="text-[#b12e2e] w-5 h-5 sm:w-6 sm:h-6 hover:scale-110 transition-transform" />
                        </button>

                        {/* Popup-уведомление */}
                        {showAddedPopup && (
                            <div className="absolute -top-10 right-0 bg-green-600 text-[#f6eaea] text-sm px-4 py-1 rounded-full shadow-lg animate-fade-in-out flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                Добавлено!
                            </div>
                        )}
                    </div>
                </div>
            </div>
            </div>

            {/* Модалка через Portal - рендерится в body, вне всех контейнеров */}
            {mounted && isModalOpen && createPortal(
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-[100] p-2 sm:p-4 overflow-y-auto">
                    <div
                        className={`relative bg-[#0C0C0C] rounded-lg w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto my-2 sm:my-4 transform transition-all duration-300 ${
                            isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-[#f6eaea] text-xl font-bold z-10 bg-[#0C0C0C] rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#1a1a1a] transition-colors"
                        >
                            ✕
                        </button>
                        <MoreAbout product={product} onAddToCart={() => {
                            dispatch(addToCart({ productId: product.id, quantity: 1 }));
                            handleCloseModal();
                        }} />
                    </div>
                </div>,
                document.body
            )}
            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

        </div>
    );
};

export default CartItem;
