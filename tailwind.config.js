/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg-dark': '#111827',
        'brand-bg-light': '#1f2937',
        'brand-primary': '#4f46e5',
        'brand-secondary': '#6366f1',
        'brand-text': '#f9fafb',
        'brand-text-muted': '#9ca3af',
        'brand-accent': '#ec4899',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    }
  },
  plugins: [],
}
