/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        header: ['Montserrat', 'sans-serif'],
      },
      fontSize: {
        "mobile-header": ["1.4rem", "1.7rem"]
      }
    },
  },
  plugins: [],
}