/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f4f6fb', 100: '#e6ebf5', 200: '#c8d3e6', 300: '#a3b4d1',
          400: '#7789b3', 500: '#566a96', 600: '#41537b', 700: '#334165',
          800: '#232d47', 900: '#0f172a', 950: '#080d18',
        },
        violet: {
          50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
          400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
          800: '#5b21b6', 900: '#4c1d95',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)',
        glow: '0 0 0 1px rgba(139,92,246,0.15), 0 8px 24px rgba(139,92,246,0.15)',
      },
    },
  },
  plugins: [],
};