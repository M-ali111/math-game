/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyan: {
          50: '#ecf8fb',
          100: '#cff1f8',
          200: '#a3e8f3',
          300: '#6edceb',
          400: '#44cfea',
          500: '#00BCD4',
          600: '#00a0c0',
          700: '#00879f',
          800: '#006d81',
          900: '#005a6a',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', '"Fira Sans"', '"Droid Sans"', '"Helvetica Neue"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
