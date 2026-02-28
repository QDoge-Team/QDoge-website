/** @type {import('tailwindcss').Config} */
import { heroui } from "@heroui/react";
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-geist-mono)', 'Geist Mono', 'monospace'],
      },
      backgroundImage: {
        'casino': "url('/assets/image/hero-background.webp')",
        // simplified game thumbnails without mascot
        'mine': "url('/assets/image/mine_simple.png')",
        'jackport': "url('/assets/image/jackpot_simple.png')",
        'crash': "url('/assets/image/crash_simple.png')",
        'poker': "url('/assets/image/poker_simple.png')",
      },
      colors: {
        dark: {
          900: '#000000',
          600: '#0a0a0a',
          500: '#111111',
        },
        cyber: {
          black: '#0a0a0a',
          blue: '#00f3ff',
          purple: '#bc13fe',
          green: '#39ff14',
          electric: '#0080ff',
        },
        sider_panel: 'rgba(0, 0, 0, 0.85)',
        panel: 'rgba(0, 0, 0, 0.8)',
        input_bg: 'rgba(0, 243, 255, 0.05)',
        input_hover: 'rgba(0, 243, 255, 0.12)',
        text_1: '#67e8f9',
        border: 'rgba(0, 243, 255, 0.2)',
      },
      keyframes: {
        zoomIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        explode: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'neon-pulse': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.2)' },
        },
        'glow-line': {
          '0%': { transform: 'scaleX(0)', opacity: '0' },
          '50%': { transform: 'scaleX(1)', opacity: '1' },
          '100%': { transform: 'scaleX(0)', opacity: '0' },
        },
      },
      animation: {
        zoomIn: 'zoomIn 0.2s ease-in-out',
        explode: 'explode 0.4s ease-in-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
        'glow-line': 'glow-line 3s linear infinite',
      },
      boxShadow: {
        'neon': '0 0 5px rgba(0, 243, 255, 0.3), 0 0 20px rgba(0, 243, 255, 0.1)',
        'neon-lg': '0 0 10px rgba(0, 243, 255, 0.4), 0 0 40px rgba(0, 243, 255, 0.15)',
        'neon-green': '0 0 5px rgba(57, 255, 20, 0.3), 0 0 20px rgba(57, 255, 20, 0.1)',
        'input': '0 0 0 1px rgba(0, 243, 255, 0.1)',
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
}

