import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#8B5A2B",
        secondary: "#D4AF37",
        muted: "#6B7280",
      },
    },
  },
  plugins: [],
};

export default config;
