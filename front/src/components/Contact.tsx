import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import MapComponent from "./MapComponent.tsx";
import { SlPhone, SlLocationPin, SlClock, SlArrowRight } from "react-icons/sl";

const Contact = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const contactInfo = [
    {
      icon: <SlPhone className="text-2xl" />,
      title: "ТЕЛЕФОН",
      content: "+7 (963) 012-14-69",
      description: "Звоните для заказа"
    },
    {
      icon: <SlLocationPin className="text-2xl" />,
      title: "АДРЕС",
      content: "ул. Камская д. 1Б",
      description: "Приезжайте в гости"
    },
    {
      icon: <SlClock className="text-2xl" />,
      title: "ВРЕМЯ РАБОТЫ",
      content: "Ежедневно: 10:00 - 23:00",
      description: "Без выходных, заказы принимаем до 22:45"
    }
  ];

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden" ref={ref}>
      {/* Фон с градиентами */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#242424] to-[#171717] -z-10"></div>
      
      {/* Декоративные элементы */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-[#b12e2e]/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#b12e2e]/5 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Левая колонка - Контактная информация */}
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
              <h2 className="text-[#b12e2e] font-bold text-4xl sm:text-5xl lg:text-6xl text-center lg:text-start">
                КОНТАКТЫ
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-[#b12e2e] to-transparent mt-4 rounded-full"></div>
              <p className="text-[#ADADAD] text-lg mt-4 text-center lg:text-start">
                Свяжитесь с нами удобным для вас способом
              </p>
            </motion.div>

            {/* Контактная информация */}
            <motion.div
              className="space-y-6 lg:space-y-8 mb-8 lg:mb-12"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {contactInfo.map((item, index) => (
                <motion.div
                key={index}
                className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm"
                whileHover={{ 
                  scale: 1.02, 
                  backgroundColor: "rgba(232, 38, 43, 0.1)",
                  borderColor: "rgba(232, 38, 43, 0.3)",
                  transition: { duration: 0.3 }
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              >
                  <div className="flex-shrink-0 w-12 h-12 bg-[#b12e2e] rounded-xl flex items-center justify-center">
                    <div className="text-white">
                      {item.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#E9E9E9] font-bold text-lg mb-1">
                      {item.title}
                    </h3>
                    <p className="text-[#ADADAD] font-semibold text-base">
                      {item.content}
                    </p>
                    <p className="text-[#ADADAD] text-sm mt-1">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Кнопка */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 1 }}
            >
              <motion.button
                className="group relative w-full lg:w-auto bg-[#b12e2e] text-white font-bold text-lg lg:text-xl py-5 px-8 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="flex items-center justify-center gap-3 relative z-10">
                  Перейти в каталог
                  <SlArrowRight className="text-xl group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Правая колонка - Карта */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={isInView ? { opacity: 1, scale: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              {/* Декоративные элементы вокруг карты */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#b12e2e]/20 rounded-full blur-xl -z-10"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#b12e2e]/10 rounded-full blur-xl -z-10"></div>
              
              {/* Карта */}
              <div className="w-full h-[500px] lg:h-[600px] rounded-2xl overflow-hidden relative">
                <MapComponent />
                
                {/* Наложение с градиентом для красоты */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/30 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
              </div>

              {/* Информация на карте */}
              <motion.div
                className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-[#b12e2e] rounded-full"></div>
                  <div>
                    <p className="text-[#171717] font-bold text-sm">
                      Shushiritto
                    </p>
                    <p className="text-[#666] text-xs">
                      Камская улица, 1Б
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;