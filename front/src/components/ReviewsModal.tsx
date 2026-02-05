import { motion, AnimatePresence } from "framer-motion";
import { X, Star } from "lucide-react";
import { useEffect } from "react";

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReviewsModal = ({ isOpen, onClose }: ReviewsModalProps) => {
  // Блокировка скролла при открытом модальном окне
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Оверлей */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Модальное окно */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              className="relative w-full max-w-5xl max-h-[90vh] bg-gradient-to-br from-[#1a1a1a] to-[#242424] rounded-2xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Декоративные элементы */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#b12e2e]/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#b12e2e]/10 rounded-full blur-3xl"></div>

              {/* Заголовок */}
              <div className="relative border-b border-[#f6eaea]/10 p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className="w-5 h-5 lg:w-6 lg:h-6 text-[#b12e2e] fill-[#b12e2e]"
                        />
                      ))}
                    </div>
                    <h2 className="text-[#E9E9E9] font-bold text-xl lg:text-2xl">
                      Отзывы наших клиентов
                    </h2>
                  </div>
                  
                  {/* Кнопка закрытия */}
                  <motion.button
                    onClick={onClose}
                    className="p-2 rounded-lg bg-[#f6eaea]/5 hover:bg-[#f6eaea]/10 border border-[#f6eaea]/10 hover:border-[#b12e2e]/50 transition-all duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5 lg:w-6 lg:h-6 text-[#ADADAD] hover:text-[#b12e2e]" />
                  </motion.button>
                </div>
              </div>

              {/* Контент */}
              <div className="relative p-4 lg:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Виджет Яндекс.Карт */}
                <div className="relative bg-[#f6eaea]/5 rounded-xl border border-[#f6eaea]/10 p-3 lg:p-4">
                  <div className="relative overflow-hidden rounded-lg">
                    <iframe 
                      style={{
                        width: "100%",
                        height: "600px",
                        border: "none",
                        borderRadius: "8px",
                        boxSizing: "border-box"
                      }}
                      src="https://yandex.ru/maps-reviews-widget/185486410426?comments"
                      title="Отзывы на Яндекс.Картах"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReviewsModal;
