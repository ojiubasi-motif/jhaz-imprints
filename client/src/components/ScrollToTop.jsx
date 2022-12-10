import React, { useState } from "react";
import { animateScroll } from "react-scroll";

const ScrollToTop = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  //make changes to styles on vertical scroll
  window.onscroll = () => {
    setIsScrolled(window.pageYOffset === 0 ? false : true);
    return () => (window.onscroll = null);
  };

  return (
    <div
      // to="#"
      onClick={() => animateScroll.scrollToTop()}
      className={`fixed right-[1rem] inline-flex p-[.35rem] text-titleColor text-[1.1rem] z-zTooltip duration-[.3s] shadow-[0_8px_12px_hsla(220,18%,45%,.15)] hover:translate-y-[-.25rem] ${
        isScrolled ? "bottom-[7.5rem]" : "bottom-[-30%]"
      }`}
    >
      <i className="ri-arrow-up-line flex items-center justify-center"></i>
    </div>
  );
};

export default ScrollToTop;
