/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primeBlue: "#3b82f6",
        primeGreen: "#10b981",
        primeYellow: "#f59e0b"
      }
    },
  },
  plugins: [],
}
