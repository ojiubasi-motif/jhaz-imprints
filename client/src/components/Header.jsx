import React,{useState} from "react";
import logo from "../assets/img/logo6.png";
import { navLinks } from "../constants";
// import styles from "../style";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  //make changes to styles on vertical scroll
  window.onscroll = () => {
    setIsScrolled(window.pageYOffset === 0 ? false : true);
    return () => (window.onscroll = null);
};

  return (
    <header className={`fixed top-0 left-0 w-[100%] bg-transparent z-zFixed duration-[.4s] ${isScrolled?"bg-bodyColor shadow-[0_1px_4px_hsla(220,4%,15%,.1)]":""}`}>
      <nav className="containerGlobal h-[3.5rem] flex justify-between items-center">
        <a href="#" className="">
          <img src={logo} alt="logo" className=" w-[124px] h-[72px]" />
        </a>

        <div className="fixed bottom-[1.5rem] bg-bodyColor shadow-[0 4px 12px hsla(220,18%,40%,.15)] w-[90%] left-0 right-0 my-0 mx-auto py-[1.25rem] px-[2.8rem] rounded-[.5rem]" id="nav-menu">
          <ul className="flex justify-between items-center">
            {navLinks.map((nav, index) => (
              <li key={nav.id} className="">
                <a href={`#${nav.id}`} className=" active:text-[red] text-textColorLight font-fontMedium grid justify-center gap-y-1 ">
                    <i className={`${nav.logo} text-[1.25rem]  flex items-center justify-center`}></i>
                <span className=" text-[.688rem] ">
                {nav.title}
                </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        {/* theme change button */}
        <i className="ri-moon-fill"></i>
      </nav>
    </header>
  );
};

export default Header;
