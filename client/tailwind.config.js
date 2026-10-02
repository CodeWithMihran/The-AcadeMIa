/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        notion: {
          bg: '#fbfbfa',
          dark: '#1a1a1a',
          card: '#ffffff',
          border: '#e5e7eb',
          subtle: '#9ca3af'
        }
      }
    },
  },
  plugins: [],
}
