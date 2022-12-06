import React from "react";
import collection1 from '../assets/img/collection1.png'
import collection2 from '../assets/img/collection2.png'

const Collection = () => {
  return (
    <section className=" bg-bgColorLight overflow-hidden sectionGlobal" id="collection">
      <div className=" relative h-[571px] grid justify-center containerGlobal">
        <div className=" grid gap-x-[2rem] absolute grid-cols-[max-content_230px] top-0 ml-[5rem] ">
          <div className=" mt-[2.5rem]">
            <h2 className=" text-h1FontSize mb-[.75rem]">
                Men <br/>
                Collection
            </h2>
            <a href="#" className="btn_link">
                Explore Clothes <i className="ri-arrow-right-line"></i>
            </a>
          </div>
          <img src={collection1} alt="collection img"/>
        </div>

        <div className="grid gap-x-[2rem] absolute grid-cols-[230px_max-content] bottom-[1rem] mr-[5rem]">
        <img src={collection2} alt="collection img"/>
          <div className=" self-end mb-[2.5rem]">
            <h2 className="collection_title">
            Women <br/>
                Collection
            </h2>
            <a href="#" className="btn_link">
                Explore Clothes <i className="ri-arrow-right-line"></i>
            </a>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default Collection;
