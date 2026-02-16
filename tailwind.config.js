/** @type {import('tailwindcss').Config} */
import { heroui } from "@heroui/react";
module.exports = {
  content: [
    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      backgroundImage: {
        'casino': "url('/assets/image/main.png')",
        'mine': "url('/assets/image/mines.png')",
        'jackport': "url('/assets/image/Jackport.png')",
        'crash': "url('/assets/image/crashgame.png')",
        'poker': "url('/assets/image/poker.png')",
      },
      colors:{
        dark:{
          900:"#030612",
          600:"#0e141d",
          500:"#141923"
        }
      }
      
    },

  },
  darkMode: "class",
  plugins: [heroui()],
}

