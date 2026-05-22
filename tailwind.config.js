/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        surface: 'rgba(20, 20, 30, 0.8)',
        'surface-hover': 'rgba(30, 30, 45, 0.9)',
        border: 'rgba(255, 255, 255, 0.1)',
        foreground: '#f0f0f5',
        muted: '#8888a0',
        cyan: '#00d4ff',
        purple: '#a855f7',
        emerald: '#10b981',
        orange: '#f97316',
        red: '#ef4444',
      },
    },
  },
  plugins: [],
};
