/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          950: '#081126',
          900: '#0f1d3a',
          800: '#182a52',
          700: '#273d71',
          600: '#375496',
          500: '#4d67b6',
          400: '#7d96db',
          300: '#b6c4eb',
          200: '#d8e0f7',
          100: '#edf2ff',
        },
        accent: {
          500: '#f3694d',
          400: '#ff8a64',
        },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        sans: ['IBM Plex Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

