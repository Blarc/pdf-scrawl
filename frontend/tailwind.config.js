/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: '#fbf9f8',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f5f3f3',
        'surface-container': '#efeded',
        'surface-container-high': '#e4e2e2',
        'surface-container-highest': '#e4e2e2',
        'surface-bright': '#fbf9f8',
        primary: '#00488d',
        'primary-container': '#005fb8',
        'primary-fixed': '#d6e3ff',
        secondary: '#c9e6fd',
        'secondary-fixed': '#c9e6fd',
        tertiary: '#e4ec00',
        'tertiary-fixed': '#e4ec00',
        error: '#ba1a1a',
        'on-surface': '#1b1c1c',
        'on-secondary-container': '#001d35',
        'outline-variant': 'rgba(0, 0, 0, 0.15)',
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      boxShadow: {
        'ambient': '0 0 32px 0 rgba(27, 28, 28, 0.06)',
      },
    },
  },
  plugins: [],
}
