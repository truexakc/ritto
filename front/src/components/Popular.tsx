import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPopularProducts } from "../services/product.ts";
import { Product } from "../types/Product.ts";
import CartItem from "./CartItem";

const Popular = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const { data: products, isLoading, isError } = useQuery<Product[]>({
        queryKey: ['popularProducts'],
        queryFn: getPopularProducts,
    });

    const [slide, setSlide] = useState(0);

    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile screen
    useState(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    });

    const itemsPerSlide = isMobile ? 1 : 4;
    const totalSlides = products ? Math.ceil(products.length / itemsPerSlide) : 0;

    const getSlideItems = () => {
        if (!products || !Array.isArray(products)) return [];
        const start = slide * itemsPerSlide;
        return products.slice(start, start + itemsPerSlide);
    };

    // Mobile swipe handlers
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    const onTouchStart = (e: React.TouchEvent) => {
        touchEndX.current = null;
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        const distance = touchStartX.current - touchEndX.current;
        const threshold = 40; // px
        if (Math.abs(distance) < threshold) return;
        if (distance > 0) {
            // swipe left -> next
            setSlide((prev) => (totalSlides === 0 ? 0 : (prev + 1) % totalSlides));
        } else {
            // swipe right -> prev
            setSlide((prev) => (totalSlides === 0 ? 0 : (prev - 1 + totalSlides) % totalSlides));
        }
    };
    
    return (
        <section className="pt-10 lg:pt-28" ref={ref}>
            <div className="container">
                <motion.div
                    className="flex lg:flex-col justify-center lg:justify-start"
                    initial={{ opacity: 0, y: 50 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 1 }}
                >
                    <h2 className="text-[#b12e2e] font-bold lg:text-5xl text-2xl">
                        ПОПУЛЯРНЫЕ
                    </h2>
                    <p className="text-[#E9E9E9] font-bold lg:text-5xl pl-2 lg:pl-0 text-2xl">
                        БЛЮДА
                    </p>
                </motion.div>

                {/* Dots Navigation */}
                {totalSlides > 1 && (
                    <div className="flex justify-center lg:justify-end gap-2 items-center mt-6">
                        {Array.from({ length: totalSlides }).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setSlide(index)}
                                className={`transition-all duration-300 rounded-full ${
                                    slide === index
                                        ? 'bg-[#b12e2e] w-8 h-2'
                                        : 'bg-gray-400 hover:bg-gray-300 w-2 h-2'
                                }`}
                                aria-label={`Перейти к слайду ${index + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Slider Content */}
                <motion.div
                    key={slide}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="grid grid-cols-1 lg:grid-cols-4 gap-4 py-4 text-white"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    {isLoading && <p className="text-white">Загрузка...</p>}
                    {isError && <p className="text-white">Ошибка загрузки продуктов</p>}
                    {getSlideItems().map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <CartItem product={product} />
                        </motion.div>
                    ))}
                </motion.div>

                {/* Mobile Controls removed: swipe only */}

                {/* Swipe Progress Bar */}
                {totalSlides > 1 && (
                    <div className="hidden lg:block w-full bg-gray-700 h-1 rounded-full mt-4 overflow-hidden">
                        <motion.div
                            className="bg-[#b12e2e] h-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${((slide + 1) / totalSlides) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                )}

                <div className="hidden lg:block text-center mt-10">
                    <Link 
                        to="/catalog" 
                        className="inline-block text-[#ffffff] hover:bg-[#9a2525] font-bold text-xl bg-[#b12e2e] py-4 px-10 mb-14 transition-colors duration-300 rounded-full"
                    >
                        Перейти в каталог
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Popular;