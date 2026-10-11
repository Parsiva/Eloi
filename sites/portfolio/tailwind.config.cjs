/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        ivory: '#f6ecd5',
        clay: '#7a5a3d',
        charcoal: '#2b2b2b',
      },
      fontFamily: {
        display: ['"Old London"', 'serif'],
        oldlondon: ['"Old London"', 'serif'],
        serif: ['"EB Garamond"', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
