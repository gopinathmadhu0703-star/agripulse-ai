/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Forest green primary palette
        forest: {
          50:  '#f0f7f4',
          100: '#d9ede5',
          200: '#b5dbcc',
          300: '#83c2aa',
          400: '#52b788',
          500: '#40916c',
          600: '#2d6a4f',
          700: '#1b4332',
          800: '#143526',
          900: '#0d2b1e',
        },
        // Off-white background
        cream: {
          50:  '#fafaf7',
          100: '#f8f9f4',
          200: '#f0f1ea',
          300: '#e4e6dc',
        },
        // Neutral grays
        stone: {
          50:  '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
