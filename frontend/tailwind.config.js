/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          500: '#3b5bfd',
          600: '#2f49d6',
          700: '#2439a8'
        },
        ink: {
          900: '#0d1117',
          700: '#2b3444',
          500: '#5a6679',
          300: '#9aa4b5'
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f6f8fb',
          border: '#e3e8ef'
        },
        state: {
          success: '#12805c',
          warn: '#b45309',
          danger: '#c0392b',
          info: '#2563eb'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif']
      },
      borderRadius: {
        card: '14px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(13,17,23,.04), 0 8px 24px rgba(13,17,23,.06)'
      }
    },
  },
  plugins: [],
}
