import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getActiveDiscount } from "../services/discount";
import { Discount } from "../types/Discount";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const Discounts = () => {
  const { data: discount, isLoading, isError } = useQuery<Discount>({
    queryKey: ["activeDiscount"],
    queryFn: getActiveDiscount,
  });

  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (discount) {
      const timeout = setTimeout(() => setAnimate(true), 100); // даём DOM отрисоваться
      return () => clearTimeout(timeout);
    }
  }, [discount]);

  if (isLoading) return <p className="text-center py-8 text-white">Загрузка...</p>;
  if (isError || !discount) return null;

  return (
      <section className="mt-10 lg:mt-28 bg-[#e8262b] overflow-hidden border-4 border-black">
        <div className="container lg:pt-24 lg:pb-16 pt-12 pb-8">
          <div className="grid lg:grid-cols-2 gap-12 grid-cols-1">
            <motion.div
                className="lg:flex justify-center"
                initial={{ opacity: 0, y: 30 }}
                animate={animate ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8 }}
            >
              <img src={discount.image} alt={discount.title} className="max-w-full" />
            </motion.div>

            <motion.div
                className="flex flex-col items-end pt-5"
                initial={{ opacity: 0, y: 30 }}
                animate={animate ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
              <p className="text-[#FFFFFF] xl:text-lg text-xs">{discount.description}</p>
              <h2 className="text-lg sm:text-2xl md:text-3xl xl:text-5xl mt-4 text-[#E9E9E9] font-bold">
                {discount.title}
              </h2>
              <p className="md:text-3xl text-lg sm:text-2xl xl:text-5xl mt-4 text-[#E9E9E9] font-bold">
                {discount.subtitle}
              </p>

              <div className="flex pt-6 xl:pt-11 items-center">
                <p className="text-[#B5B4B4] font-bold md:text-xl xl:text-3xl line-through sm:text-xl text-lg">
                  {discount.old_price} р
                </p>
                <p className="text-[#E9E9E9] font-bold text-xl sm:text-3xl xl:text-5xl ml-2 md:text-2xl">
                  {discount.new_price} р
                </p>
              </div>

              <span className="text-[#FFFFFF] xl:text-lg text-xs mt-4">{discount.description}</span>

              <motion.button
                  className="lg:w-72 text-[#E1E6E9] font-bold text-xl bg-[#171717] lg:py-8 mt-5 lg:mt-auto w-full py-4 rounded-full"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
              >
                <Link to="/catalog">Перейти в каталог</Link>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>
  );
};

export default Discounts;
