// components/AuthModal.tsx
import { Link } from "react-router-dom";

interface AuthModalProps {
    onClose: () => void;
}

const AuthModal = ({ onClose }: AuthModalProps) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-[#f6eaea] rounded-xl p-6 w-full max-w-sm text-center shadow-lg relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-3 text-gray-500 hover:text-black text-xl font-bold"
                >
                    ✕
                </button>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Войдите в аккаунт</h2>
                <p className="text-gray-600 text-sm mb-6">
                    Чтобы добавлять товары в корзину, пожалуйста, авторизуйтесь.
                </p>
                <Link
                    to="/login"
                    className="bg-[#b12e2e] text-[#f6eaea] px-6 py-2 rounded-full font-medium hover:bg-[#9a2525]"
                >
                    Войти
                </Link>
            </div>
        </div>
    );
};

export default AuthModal;
