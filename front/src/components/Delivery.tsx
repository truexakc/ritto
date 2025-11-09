import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SlArrowDown, SlPhone, SlClock, SlLocationPin } from "react-icons/sl";

const Delivery = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      icon: "📱",
      title: "СДЕЛАЙТЕ ЗАКАЗ",
      description: "Выберите понравившийся товар и оформите заказ за несколько простых шагов."
    },
    {
      icon: "📞",
      title: "ОЖИДАНИЕ ЗВОНКА",
      description: "После оформления заказа, с Вами свяжется оператор для подтверждения"
    },
    {
      icon: "🚗",
      title: "ЗАКАЗ УЖЕ В ПУТИ",
      description: "Когда мы утвердили заказ, мы готовим и отправляем Вам заказ"
    }
  ];

  return (
    <section className="relative lg:pt-32 pt-16 pb-20 overflow-hidden text-[#f6eaea]" ref={ref}>
      {/* Фон с градиентами */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#242424] to-[#171717] -z-10"></div>
      
      {/* Декоративные элементы */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-[#F5920B]/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#E17D18]/10 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto px-4">
        <div className="grid xl:grid-cols-3 lg:grid-cols-2 gap-12 items-start">
          {/* Левая колонка - Информация о доставке */}
          <motion.div
            className="xl:col-span-2 lg:col-span-1"
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h2
              className="text-[#b12e2e] font-bold text-4xl sm:text-5xl lg:text-6xl mb-8"
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              ДОСТАВКА
            </motion.h2>

            <motion.div
              className="bg-[#f6eaea]/5 backdrop-blur-sm border border-[#f6eaea]/10 rounded-2xl p-8 shadow-2xl hover:bg-[#f6eaea]/10 hover:border-[#f6eaea]/20 transition-all duration-300"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {/* Заголовок с иконкой */}
              <div className="flex items-center gap-4 mb-6 text-[#f6eaea]">
                <div className="bg-[#b12e2e] p-3 rounded-xl shadow-lg">
                  <SlClock className="text-[#f6eaea] text-xl" />
                </div>
                <div>
                  <h3 className="text-[#E9E9E9] font-extrabold text-2xl">
                    График работы
                  </h3>
                  <p className="text-[#ADADAD] font-medium">ежедневно</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Время работы */}
                <div className="bg-[#f6eaea]/5 border border-[#f6eaea]/10 rounded-xl p-4">
                  <p className="text-lg font-semibold text-[#E9E9E9]">
                    с 10:00 до 23:00
                  </p>
                </div>

                {/* Самовывоз */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <SlLocationPin className="text-[#b12e2e] font-bold" />
                    <span className="font-bold text-[#E9E9E9] text-lg">
                      Самовывоз
                    </span>
                  </div>
                  <div className="bg-[#f6eaea]/5 border border-[#f6eaea]/10 rounded-xl p-4 ml-6">
                    <p className="text-[#ADADAD] font-semibold">
                      д. Кондратово, ул. Камская 1Б
                    </p>
                  </div>
                </div>

                {/* Доставка */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <SlArrowDown className="text-[#b12e2e] font-bold" />
                    <span className="font-bold text-[#E9E9E9] text-lg">
                      Доставка
                    </span>
                  </div>
                  <div className="space-y-2 ml-6">
                    <div className="bg-[#f6eaea]/5 border border-[#f6eaea]/10 rounded-xl p-3">
                      <p className="text-[#ADADAD] font-semibold">
                        По Кондратово бесплатно доставляем от 500 руб.
                      </p>
                    </div>
                    <div className="bg-[#f6eaea]/5 border border-[#f6eaea]/10 rounded-xl p-3">
                      <p className="text-[#ADADAD] font-semibold">
                        В город и иные отдаленные пункты, уточняйте у оператора
                      </p>
                    </div>
                  </div>
                </div>

                {/* Кнопка заказа */}
                <motion.button
                  className="w-full bg-[#b12e2e] text-[#f6eaea] py-4 rounded-xl font-bold text-lg mt-4 hover:bg-[#9a2525] transition-all duration-300 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <SlPhone className="text-[#f6eaea]" />
                    Сделать заказ
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>

          {/* Правая колонка - Изображение и шаги */}
          <div className="space-y-12">
            {/* Изображение пиццы */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="relative lg:w-96 w-80 h-80 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r bg-[#b12e2e] to-[#883434] rounded-full blur-xl opacity-30"></div>
                <img 
                  src="/pizza.png" 
                  alt="Pizza" 
                  className="relative w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
            </motion.div>

            {/* Шаги заказа */}
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  className="group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 1 + index * 0.2 }}
                >
                  <div className="flex items-start gap-4 p-4 rounded-xl transition-all duration-300 group-hover:bg-[#f6eaea]/5 group-hover:scale-105">
                    <div className="text-4xl flex-shrink-0 bg-gradient-to-br from-[#b12e2e] to-[#9a2525] p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="text-[#b12e2e] font-bold text-lg mb-2">
                        {step.title}
                      </h3>
                      <p className="text-[#ADADAD] text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Линия между шагами */}
                  {index < steps.length - 1 && (
                    <div className="h-6 border-l-2 border-dashed border-[#b12e2e]/30 ml-9"></div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Delivery;