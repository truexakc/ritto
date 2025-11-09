import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const FullscreenParallaxSlider = () => {
    const containerRef = useRef(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    
    const slides = [
        {
            id: 1,
            image: "/rolls_circle.png",
            background: "/example.jpeg",
            title: "Изысканные суши",
            subtitle: "Свежесть в каждом кусочке"
        },
        {
            id: 2,
            image: "/rolls_two.png",
            background: "/example.jpeg", 
            title: "Авторские роллы",
            subtitle: "Уникальные сочетания вкусов"
        },
        {
            id: 3,
            image: "/pizza_bg.png",
            background: "/example.jpeg",
            title: "Итальянская пицца",
            subtitle: "Тонкое тесто и лучшие начинки"
        },
        {
            id: 4,
            image: "/drinks.png",
            background: "/drinks.png",
            title: "Освежающие напитки",
            subtitle: "Идеальное дополнение"
        }
    ];

    // Автоматическая смена слайдов
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [slides.length]);

    // Параллакс эффекты
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
    const textY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0]);

    const smoothBackgroundY = useSpring(backgroundY, {
        stiffness: 100,
        damping: 30
    });
    const smoothImageY = useSpring(imageY, {
        stiffness: 100,
        damping: 30
    });

    return (
        <section 
            ref={containerRef}
            className="relative z-0 h-[100svh] w-full overflow-hidden"
        >
            {/* Фоновые слои с параллаксом */}
            {slides.map((slide, index) => (
                <motion.div
                    key={`bg-${slide.id}`}
                    className="absolute inset-0 w-full h-full"
                    style={{
                        y: smoothBackgroundY,
                        opacity: index === currentSlide ? 1 : 0,
                    }}
                    transition={{ duration: 0.8 }}
                >
                    <div
                        className="w-full h-full"
                        style={{
                            backgroundImage: `url(${slide.background})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            filter: 'brightness(0.4)'
                        }}
                    />
                </motion.div>
            ))}

            {/* Основные изображения слайдов */}
            <div className="relative h-full w-full">
                {slides.map((slide, index) => (
                    <motion.div
                        key={`main-${slide.id}`}
                        className="absolute inset-0 w-full h-full"
                        initial={false}
                        animate={{
                            opacity: index === currentSlide ? 1 : 0,
                            scale: index === currentSlide ? 1 : 1.1,
                        }}
                        transition={{
                            duration: 1.2,
                            ease: [0.25, 0.1, 0.25, 1]
                        }}
                    >
                        <motion.div
                            className="w-full h-full"
                            style={{
                                backgroundImage: `url(${slide.image})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                y: smoothImageY
                            }}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Контент поверх слайдов */}
            <div className="absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-6">
                <div className="text-center text-white">
                    {/* Логотип/Название */}
                    <motion.div
                        style={{ y: textY, opacity }}
                        className="mb-8"
                    >
                        <h1 className="text-6xl md:text-8xl font-bold mb-4 tracking-wider">
                            Sushiritto
                        </h1>
                        <div className="w-24 h-1 bg-[#b12e2e] mx-auto rounded-full" />
                    </motion.div>

                    {/* Текст слайда */}
                    <motion.div
                        className="mb-12"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ 
                            opacity: currentSlide === currentSlide ? 1 : 0,
                            y: currentSlide === currentSlide ? 0 : 30 
                        }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        key={currentSlide}
                    >
                        <h2 className="text-3xl md:text-5xl font-light mb-2">
                            {slides[currentSlide].title}
                        </h2>
                        <p className="text-xl md:text-2xl text-gray-300">
                            {slides[currentSlide].subtitle}
                        </p>
                    </motion.div>

                    {/* Кнопка заказа */}
                    <motion.a
                        href="#order"
                        className="inline-block bg-[#b12e2e] text-white px-12 py-4 rounded-full text-xl font-semibold hover:bg-[#9a2525] transition-all duration-300 transform hover:scale-105 shadow-2xl"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ opacity }}
                    >
                        Сделать заказ
                    </motion.a>
                </div>
            </div>

            {/* Навигация */}
            <div className="absolute bottom-8 left-1/2 z-10 transform -translate-x-1/2 flex space-x-3">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        className={`relative w-16 h-1 rounded-full transition-all duration-500 ${
                            index === currentSlide 
                                ? 'bg-[#b12e2e]' 
                                : 'bg-white/30 hover:bg-white/50'
                        }`}
                        onClick={() => setCurrentSlide(index)}
                    >
                        {/* Анимированный прогресс-бар внутри индикатора */}
                        {index === currentSlide && (
                            <motion.div
                                className="absolute top-0 left-0 h-full bg-[#b12e2e] rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ 
                                    duration: 5, 
                                    ease: "linear" 
                                }}
                                key={currentSlide}
                            />
                        )}
                    </button>
                ))}
            </div>
            {/* Скролл-индикатор */}
            <motion.div 
                className="absolute bottom-4 left-1/2 z-10 transform -translate-x-1/2 flex flex-col items-center text-white/60"
                style={{ opacity }}
            >
                <span className="text-sm mb-2">Листайте вниз</span>
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-5 h-8 border-2 border-white/30 rounded-full flex justify-center"
                >
                    <div className="w-1 h-2 bg-white/60 rounded-full mt-2" />
                </motion.div>
            </motion.div>

            {/* Градиентные overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/30" />
            <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-r from-black/10 via-transparent to-black/10" />
        </section>
    );
};

export default FullscreenParallaxSlider;