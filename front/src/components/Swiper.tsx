// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import CartItem from "./CartItem";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { Product } from "../types/Product";

// Mock product data for Swiper demo
const mockProduct: Product = {
    id: "1",
    name: "Mock Product",
    description: "Placeholder product",
    price: 100,
    category_id: "1",
    image_url: "/placeholder.jpg",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

const SwiperComponent = () => {
    return (
        <>
        <Swiper
  navigation={true}
  modules={[Navigation]}
  slidesPerView={4}
  spaceBetween={36}
  className="mySwiper"
>
  <SwiperSlide>
    <CartItem product={mockProduct} />
  </SwiperSlide>
  <SwiperSlide>
    <CartItem product={mockProduct} />
  </SwiperSlide>
  <SwiperSlide>
    <CartItem product={mockProduct} />
  </SwiperSlide>
  <SwiperSlide>
    <CartItem product={mockProduct} />
  </SwiperSlide>
  <SwiperSlide>
    <CartItem product={mockProduct} />
  </SwiperSlide>
  <SwiperSlide>
    <CartItem product={mockProduct} />
  </SwiperSlide>
  <SwiperSlide>
    <CartItem product={mockProduct} />
  </SwiperSlide>
  <SwiperSlide>
    <CartItem product={mockProduct} />
  </SwiperSlide>
            </Swiper>
        </>
  )
}

export default SwiperComponent



