import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { SlSocialVkontakte, SlEnvolope, SlControlPlay } from "react-icons/sl";

const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const socialLinks = [
    {
      icon: <SlSocialVkontakte className="text-2xl" />,
      href: "#",
      color: "hover:text-[#0077FF]",
      name: "VKontakte"
    },
    {
      icon: <SlEnvolope className="text-2xl" />,
      href: "#",
      color: "hover:text-[#0088CC]",
      name: "Telegram"
    },
    {
      icon: <SlEnvolope className="text-2xl" />,
      href: "#",
      color: "hover:text-[#EA4335]",
      name: "Email"
    }
  ];

  const handlePlayVideo = () => {
    setIsVideoPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handlePauseVideo = () => {
    setIsVideoPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden" ref={ref}>
      {/* Фон с градиентами */}
      <div className="absolute inset-0 bg-gradient-to-br] -z-10"></div>
      
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Левая колонка - Текст */}
          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Заголовок */}
            <motion.div
              className="mb-8 lg:mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-[#E9E9E9] font-bold text-4xl sm:text-5xl lg:text-6xl">
                О
                <span className="text-[#b12e2e] font-bold ml-3">
                  НАС
                </span>
              </h1>
              <div className="w-20 h-1 bg-gradient-to-r from-[#b12e2e] to-transparent mt-4 rounded-full"></div>
            </motion.div>

            {/* Текст */}
            <motion.div
              className="space-y-6 lg:space-y-8 lg:pr-8"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="space-y-4">
                <p className="text-[#ADADAD] text-base lg:text-lg leading-relaxed">
                Добро пожаловать в мир изысканной японской кухни с SUSHIRITTO! Мы — команда, которая страстно любит это искусство и готова поделиться с вами настоящими кулинарными шедеврами.
                </p>
                <p className="text-[#ADADAD] text-base lg:text-lg leading-relaxed">
                Одним из основных принципов нашей работы является использование только свежих и качественных продуктов. Мы тщательно отбираем ингредиенты, чтобы каждая порция роллов удивляла вас гармонией вкуса и текстуры. Наша команда шеф-поваров непрерывно изучает новые технологии и рецепты, чтобы предложить вам разнообразное меню, которое будет радовать глаз и пробуждать аппетит.
                </p>
                <p className="text-[#ADADAD] text-base lg:text-lg leading-relaxed">
                Мы гордимся тем, что на протяжении всего нашего пути длиной в 6 лет - постоянно растем и развиваемся, чтобы улучшать наш сервис и предлагать вам лучшие блюда. Для нас важно, чтобы каждая доставка была на высшем уровне, а каждый ваш заказ оказался шедевром. Ваше удовлетворение — наша главная награда!
                </p>
              </div>
            </motion.div>

            {/* Социальные сети */}
            <motion.div
              className="mt-8 lg:mt-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <p className="text-[#E9E9E9] font-semibold text-lg mb-4">
                Следите за нами:
              </p>
              <ul className="flex gap-4 lg:gap-6">
                {socialLinks.map((social, index) => (
                  <motion.li
                    key={index}
                    whileHover={{ scale: 1.1, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <a
                      href={social.href}
                      className={`
                        flex items-center justify-center
                        w-12 h-12 lg:w-14 lg:h-14
                        bg-white/5 rounded-xl
                        text-[#ADADAD] border border-white/10
                        transition-all duration-300
                        hover:bg-white/10 hover:border-white/20
                        ${social.color}
                      `}
                      aria-label={social.name}
                    >
                      {social.icon}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          {/* Правая колонка - Видео */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={isInView ? { opacity: 1, scale: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative group">
              {/* Видео плеер (всегда рендерим) */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <video
                  ref={videoRef}
                  controls={isVideoPlaying}
                  className="w-full h-auto block"
                  preload="metadata"
                  playsInline
                  poster="/video.jpeg"
                  onEnded={handlePauseVideo}
                  onPause={handlePauseVideo}
                >
                  <source src="/video.mp4" type="video/mp4" />
                  Ваш браузер не поддерживает видео тег.
                </video>
              </div>

              {/* Превью с кнопкой воспроизведения */}
              {!isVideoPlaying && (
                <div 
                  className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
                  onClick={handlePlayVideo}
                >
                  <img 
                    src="/video.jpeg" 
                    alt="О нашем ресторане" 
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Наложение с градиентом */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-300"></div>
                  
                  {/* Кнопка воспроизведения */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="relative">
                      <div className="w-20 h-20 lg:w-24 lg:h-24 bg-[#b12e2e] rounded-full flex items-center justify-center shadow-2xl group-hover:shadow-3xl transition-all duration-300">
                        <SlControlPlay className="text-white text-2xl lg:text-3xl ml-1" />
                      </div>
                      
                      {/* Анимированная волна */}
                      <motion.div
                        className="absolute inset-0 border-2 border-[#b12e2e] rounded-full"
                        animate={{
                          scale: [1, 1.2, 1.4],
                          opacity: [1, 0.5, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeOut"
                        }}
                      />
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Декоративный элемент */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#b12e2e]/20 rounded-full blur-xl -z-10"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#b12e2e]/10 rounded-full blur-xl -z-10"></div>
            </div>

            {/* Подпись под видео */}
            <motion.div
              className="text-center mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <p className="text-[#ADADAD] text-sm lg:text-base">
                Посмотрите нашу историю
              </p>
              <p className="text-[#E9E9E9] font-semibold text-lg lg:text-xl mt-1">
                Всего 2 минуты
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Дополнительная статистика */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mt-16 lg:mt-24"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
        >
          {[
            { number: "5+", label: "Лет опыта" },
            { number: "1000+", label: "Довольных клиентов" },
            { number: "50+", label: "Видов пиццы" },
            { number: "24/7", label: "Поддержка" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="text-center p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm"
              whileHover={{ 
                scale: 1.05, 
                backgroundColor: "rgba(232, 38, 43, 0.1)",
                borderColor: "rgba(232, 38, 43, 0.3)"
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-[#b12e2e] font-bold text-2xl lg:text-3xl mb-2">
                {stat.number}
              </div>
              <div className="text-[#ADADAD] text-sm lg:text-base">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default About;