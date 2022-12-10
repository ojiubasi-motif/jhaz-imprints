import React from "react";
import { BrandLogo } from "../assets/img";
import { footerContent, footerSocial } from "../constants";

const Footer = () => {
  return (
    <footer className=" footer-Sty sectionGlobal">
      <div className=" !gap-y-[3rem] containerGlobal gridGlobal">
        <div>
          <a href="#" className=" inline-block mb-[.7rem]">
            <img src={BrandLogo} alt="logo" className=" w-[124px] h-[72px]" />
          </a>
          <p>
            Committed to bringing you the best clothing experience
            <br />
            tailored to your taste
          </p>
        </div>

        <div className=" grid grid-cols-[repeat(2,max-content)] gap-x-[3.5rem] gap-y-[3rem]">
          {footerContent.map((content) => (
            <div key={content.divId}>
              <h3 className=" text-h3FontSize mb-[1.25rem]">{content.divId}</h3>
              <ul className="grid gap-y-[.75rem]">
                {content.items.map((item) => (
                  <li key={item.id}>
                    <a href="#" className=" text-smallFontSize text-textColor duration-[.3s] hover:text-titleColor hover:underline">
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className=" text-h3FontSize mb-[1.25rem]">Office</h3>
            <p className="text-smallFontSize ">
              Monday - Saturday <br />
              9AM - 10PM
            </p>
          </div>

          <div>
            <h3>Contact us</h3>
            <ul className="footer_social flex gap-[.5rem]">
              {footerSocial.map((social) => (
                <a key={social.id} href={`${social.link}`} target="_blank" className="footer_social-link inline-flex text-titleColor p-[.4rem] bg-containerColor text-[1.25rem] transition duration-[.3s] hover:bg-bgColorLight">
                  <i className={social.logo}></i>
                </a>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-[6rem] pb-[6rem] flex flex-col items-center gap-y-[.75rem] containerGlobal">
        <span className="footer_copy text-smallerFontSize text-textColorLight">
            &#169; Motif Dev. All rights reserved
        </span>

        <a href="#" className="footer_privacy text-smallerFontSize text-textColorLight">
            Terms & Conditions
        </a>
      </div>
    </footer>
  );
};

export default Footer;