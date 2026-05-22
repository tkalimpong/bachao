/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: ['bg-ink'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',
          950: '#0f1d3d',
        },
        /** Near-black panels — deep navy (replaces gray-900 cards) */
        ink: {
          DEFAULT: '#0d1f42',
          light:   '#152a52',
        },
        surface: '#FAFAF8',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.25rem' }],
        sm: ['0.9375rem', { lineHeight: '1.375rem' }],
        base: ['1.0625rem', { lineHeight: '1.625rem' }],
        lg: ['1.1875rem', { lineHeight: '1.75rem' }],
        xl: ['1.3125rem', { lineHeight: '1.875rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
    },
  },
  plugins: [],
};
