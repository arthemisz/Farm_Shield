/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        forest: {
          DEFAULT: '#18251D',    // Secondary agricultural deep green
          50: '#F4F7F4',
          100: '#E5EBDD',
          200: '#DCE8D8',
          300: '#A9C4A6',
          400: '#A6C487',        // Natural bright green
          500: '#487146',
          600: '#345E40',
          700: '#2B4031',        // Standard forest
          800: '#24392B',
          900: '#18251D',        // Deep secondary
          950: '#111913',        // Deep primary background
        },
        agri: {
          bg: '#111913',         // Primary deep background
          surface: '#18251D',    // Secondary background
          card: '#1B2A21',
          border: 'rgba(166, 196, 135, 0.18)',
          borderLight: 'rgba(166, 196, 135, 0.4)',
          text: '#F3F2E9',       // White primary text
          muted: '#A9B2A5',      // Soft gray for readability
          bright: '#B5CF78',     // Vibrant biological green
          gold: '#E4BA6D',       // Warm agricultural gold
          orange: '#D48756',     // Terracotta accent
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'natural-xs': '0 1px 3px 0 rgba(0, 0, 0, 0.2)',
        'natural-sm': '0 2px 6px -1px rgba(0, 0, 0, 0.25)',
        'natural': '0 4px 12px -2px rgba(0, 0, 0, 0.3)',
        'natural-lg': '0 10px 24px -4px rgba(0, 0, 0, 0.45)',
        'agri-glow': '0 0 20px -5px rgba(181, 207, 120, 0.2)',
      },
    },
  },
  plugins: [],
}
