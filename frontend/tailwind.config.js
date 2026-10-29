/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'portrait-phone': { raw: '(orientation: portrait) and (max-width: 540px)' },
        'landscape-board': { raw: '(orientation: landscape) and (max-height: 540px)' },
      },
      colors: {
        board: {
          bg: '#1a1a2e',
          surface: '#16213e',
          toolbar: '#0f3460',
          accent: '#e94560',
          muted: '#533483',
        },
      },
      fontSize: {
        'tool': ['1.125rem', { lineHeight: '1.5' }],
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
    },
  },
  plugins: [],
};
