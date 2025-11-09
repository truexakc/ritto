import { motion } from "framer-motion";
import { SlSocialVkontakte, SlEnvolope, SlPhone } from "react-icons/sl";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      icon: <SlSocialVkontakte className="text-xl lg:text-2xl" />,
      href: "https://vk.com/sushiritto_59",
      name: "VKontakte",
      color: "hover:text-[#0077FF]"
    },
    {
      icon: <SlEnvolope className="text-xl lg:text-2xl" />,
      href: "https://t.me/+79630121469",
      name: "Telegram",
      color: "hover:text-[#0088CC]"
    },
    {
      icon: <SlPhone className="text-xl lg:text-2xl" />,
      href: "tel:+79630121469",
      name: "Phone",
      color: "hover:text-[#b12e2e]"
    }
  ];

  const footerLinks = [
    { name: "Каталог", href: "/catalog" },
    { name: "О нас", href: "#about" },
    { name: "Контакты", href: "#contacts" },
    { name: "Доставка", href: "#delivery" }
  ];

  return (
    <footer className="relative bg-gradient-to-br from-[#1a1a1a] to-[#242424] border-t border-[#f6eaea]/10">
      {/* Декоративные элементы */}
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#b12e2e]/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#b12e2e]/3 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          {/* Лого и описание */}
          <motion.div
            className="flex flex-col lg:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.a
              href="#"
              className="mb-4 inline-block"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <img
                src="/logo2.svg"
                alt="logo"
                className="max-w-32 md:max-w-48 lg:max-w-56 h-auto"
              />
            </motion.a>
            <p className="text-[#ADADAD] text-sm lg:text-base leading-relaxed max-w-md mb-6">
              Мы создали SUSHIRITTO с любовью и заботой. 
              Свежие ингредиенты, быстрая доставка и вкусные блюда - это наша основная ценность.
            </p>
            
            {/* Контактная информация */}
            <div className="space-y-2">
              <p className="text-[#E9E9E9] font-semibold text-sm">+7 (963) 012-14-69</p>
              <p className="text-[#ADADAD] text-sm">д. Кондратово, ул. Камская 1Б</p>
              <p className="text-[#ADADAD] text-sm">Ежедневно: 10:00 - 23:00</p>
            </div>
          </motion.div>

          {/* Навигационные ссылки */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-[#E9E9E9] font-bold text-lg lg:text-xl mb-6">
              Навигация
            </h3>
            <ul className="space-y-3">
              {footerLinks.map((link, index) => (
                <motion.li key={index} whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                  <a
                    href={link.href}
                    className="text-[#ADADAD] hover:text-[#b12e2e] transition-colors duration-200 text-sm lg:text-base"
                  >
                    {link.name}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Социальные сети и подписка */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-[#E9E9E9] font-bold text-lg lg:text-xl mb-6">
              Свяжитесь с нами
            </h3>
            
            {/* Социальные сети */}
            <div className="mb-6">
              <p className="text-[#ADADAD] text-sm mb-4">
                Следите за нашими новостями
              </p>
              <ul className="flex gap-3">
                {socialLinks.map((social, index) => (
                  <motion.li
                    key={index}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <a
                      href={social.href}
                      className={`
                        flex items-center justify-center
                        w-10 h-10 lg:w-12 lg:h-12
                        bg-[#f6eaea]/5 rounded-xl
                        text-[#ADADAD] border border-[#f6eaea]/10
                        transition-all duration-300
                        hover:bg-[#f6eaea]/10 hover:border-[#f6eaea]/20
                        ${social.color}
                      `}
                      aria-label={social.name}
                    >
                      {social.icon}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Форма подписки */}
            <div className="bg-[#f6eaea]/5 rounded-xl p-4 border border-[#f6eaea]/10">
              <p className="text-[#E9E9E9] font-semibold text-sm mb-2">
                Будьте в курсе акций
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Ваш email"
                  className="flex-1 bg-[#f6eaea]/10 border border-[#f6eaea]/20 rounded-lg px-3 py-2 text-sm text-[#f6eaea] placeholder-[#ADADAD] focus:outline-none focus:border-[#b12e2e] transition-colors"
                />
                <motion.button
                  className="bg-[#b12e2e] text-[#f6eaea] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#9a2525] transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  OK
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Нижняя часть футера */}
        <motion.div
          className="border-t border-[#f6eaea]/10 mt-8 lg:mt-12 pt-6 lg:pt-8 flex flex-col lg:flex-row justify-between items-center gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="text-center lg:text-left">
            <p className="text-[#ADADAD] text-xs lg:text-sm">
              © {currentYear} SUSHIRITTO. Все права защищены.
            </p>
            <p className="text-[#ADADAD] text-xs lg:text-sm">
              made by <span className="text-[#d7d7d7]"><a href="https://t.me/thegeneticopera">geneticopera &#129516;</a></span>
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
            <a
              href="/privacy-policy"
              className="text-[#ADADAD] hover:text-[#b12e2e] text-xs lg:text-sm transition-colors duration-200"
            >
              Политика конфиденциальности
            </a>
            <a
              href="/terms-of-service"
              className="text-[#ADADAD] hover:text-[#b12e2e] text-xs lg:text-sm transition-colors duration-200"
            >
              Условия использования
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;