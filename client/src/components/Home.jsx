import React from "react";
import h1 from "../assets/img/home1.png";
import h2 from "../assets/img/home2.png";

const Home = () => {
  return (
    <section className=" bg-bgColor overflow-hidden sectionGlobal" id="home">
      <div className="containerGlobal gridGlobal pt-[4rem] px-0 pb-[1rem] !gap-y-[8.5rem]">
        <div
          className="home
            __data"
        >
          <h1 className=" text-biggestFontSize font-[400] leading-[140%]">
            New Clothing <br />
            Collection
          </h1>
          <p className=" text-titleColor mt-[1rem] mx-0 mb-[2rem] leading-[140%]">
            The new collection of clothing from <br />
            the best brands this year.
          </p>
          <a href="#new" className="group text-titleColor font-fontMedium inline-flex items-center gap-x-[.5rem] btnLink">
            Explore<i className="ri-arrow-right-line text-[1rem] duration-[.3s] group-hover:translate-x-[.25rem]"></i>
          </a>
        </div>

        <div className=" relative w-[310px] self-center">
          <img src={h1} alt="home_img" className="w-[224px] absolute right-[-1.5rem] top-[-9.5rem]"/>
          <img src={h2} alt="home_img" className="w-[180px] ml-[.5rem] relative"/>
        </div>
      </div>
    </section>
  );
};

export default Home;
