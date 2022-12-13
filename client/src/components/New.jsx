import React from "react";
import { newCollections } from "../constants";

const New = () => {
  return (
    <section className="new sectionGlobal" id="new">
      <h2 className="section__title">New Categories</h2>
      <div className=" !gap-y-[2.5rem] pb-[1.5rem] containerGlobal gridGlobal">
        {newCollections.map((collection) => (
          <article key={collection.id} className=" justify-self-center">
            <img src={collection.img} alt="new img" className="w-[270px] xs:w-[230px] mb-[1rem]" />
            <a href="#" className=" group flex items-center justify-between text-titleColor pr-[.75rem] xs:pr-0">
              <div className="new_data">
                <h2 className=" text-h2FontSize mb-[.5rem]">{collection.title}</h2>
                <span className=" text-smallerFontSize text-textColor">{collection.subtitle}</span>
              </div>
              <i className="ri-arrow-right-line text-[1.25rem] duration-[.3s] group-hover:translate-x-[.25rem]"></i>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
};

export default New;
