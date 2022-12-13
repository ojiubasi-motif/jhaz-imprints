/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  mode: "jit",
  theme: {
    extend: {
      fontFamily: {
        lora: ["Lora", "sans-serif"],
      },
      backgroundColor:{
        bgColor:"var(--bg-color)",
        bgColorLight:"var(--bg-color-light)"
      },
      textColor:{
        titleColor:"var(--title-color)",
        textColor:"var(--text-color)",
        textColorLight:"var(--text-color-light)"
      },
      colors:{
        bodyColor:"var(--body-color)",
        containerColor:"var(--container-color)"
      },
      fontSize:{
        biggestFontSize:"var(--biggest-font-size)",
        h1FontSize:"var(--h1-font-size)",
        h2FontSize:"var(--h2-font-size)",
        h3FontSize:"var(--h3-font-size)",
        normalFontSize:"var(--normal-font-size)",
        smallFontSize:"var(--small-font-size)",
        smallerFontSize:"var(--smaller-font-size)"
      },
      fontWeight:{
        fontRegular:"var(--font-regular)",
        fontMedium:"var(--font-medium)",
        fontSemBold:"var(--font-semi-bold)"
      },
      zIndex:{
        zTooltip:"var(--z-tooltip)",
        zFixed:"var(--z-fixed)"
      }
    },
    screens:{
      'xs': {'max': '340px'},
      // => @media (max-width: 340px) { ... }
    }
  },
  plugins: [],
}
