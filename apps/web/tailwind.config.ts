import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: "#8B5A2B", // Brown for African aesthetics
        secondary: "#D4AF37", // Gold accent
        muted: "#6B7280",
        error: "#EF4444",
      },
    },
  },
  plugins: [],
};

export default config;
