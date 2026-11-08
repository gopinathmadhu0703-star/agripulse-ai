/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // AgriPulse AI design tokens
        ap: {
          bg:        '#F7F8F5',   // main page background
          card:      '#FFFFFF',   // card surfaces
          'soft':    '#EAF0E6',   // soft green tint — highlights, tags
          border:    '#E0E5DD',   // all borders
          'primary': '#24452D',   // dark green — brand, primary actions
          'secondary':'#527A45',  // mid green — secondary actions, links
          'text':    '#202820',   // primary text
          'muted':   '#687168',   // secondary / label text
          'dim':     '#9AA49A',   // placeholder, disabled text
        },
        // Keep existing forest tokens for backward-compat with existing engine/history pages
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
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'panel': '0 4px 12px 0 rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
