/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
      './*.html',
      './js/**/*.js',
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            50: '#EEF2FF',
            100: '#E0E7FF',
            200: '#C7D2FE',
            300: '#A5B4FC',
            400: '#818CF8',
            500: '#6366F1',
            600: '#4F46E5',
            700: '#4338CA',
            800: '#3730A3',
            900: '#312E81',
          },
          accent: {
            green: '#4ADE80',
            red: '#EF4444',
            purple: '#8B5CF6',
            blue: '#3B82F6',
          },
          dark: {
            bg: '#121214',
            card: '#1E1E24',
          }
        },
        fontFamily: {
          sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
          display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        },
        borderRadius: {
          'xl': '16px',
          '2xl': '24px',
        },
      }
    },
    plugins: [
      require('tailwind-scrollbar'),
    ],
  }; 