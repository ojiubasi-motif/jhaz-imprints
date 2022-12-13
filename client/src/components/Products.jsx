import React from "react";
import { products } from "../constants";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";

// import required modules
import { Navigation } from "swiper";

const Products = () => {
  return (
    <section className="sectionGlobal pb-[5rem]" id="products">
      <h2 className="section__title">Best Products</h2>

      <Swiper
        navigation={{
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        }}
        breakpoints={{
        //   640: {
        //     slidesPerView: 2,
        //     spaceBetween: 20,
        //   },
        //   768: {
        //     slidesPerView: 4,
        //     spaceBetween: 40,
        //   },
          1024: {
            // slidesPerView: 5,
            spaceBetween: 72,
          },
        }}
        spaceBetween={32}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView="auto"
        loop={true}
        modules={[Navigation]}
        className="products_container containerGlobal mySwiper"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id} className="w-[270px] xs:w-[230px]">
            <img src={product.img} alt="product img" className=" mb-[1rem]" />
            <h2 className=" text-h3FontSize mb-[.75rem]">{product.title}</h2>
            <span className=" text-titleColor font-fontMedium">
              {product.price}
            </span>
          </SwiperSlide>
        ))}

        <div className="swiper-button-next after:content-[''] top-[initial] bottom-0 w-[initial] h-[initial] text-[1.5rem] text-titleColor right-[calc(50%_-_2rem)]">
          <i className="ri-arrow-right-line"></i>
        </div>
        <div className="swiper-button-prev after:content-[''] top-[initial] bottom-0 w-[initial] h-[initial] text-[1.5rem] text-titleColor left-[calc(50%_-_2rem)]">
          <i className="ri-arrow-left-line"></i>
        </div>
      </Swiper>
    </section>
  );
};

export default Products;
