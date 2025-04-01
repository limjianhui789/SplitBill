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
          primary: { // Main application accent color scale
            50: '#EEF2FF',
            100: '#E0E7FF',
            200: '#C7D2FE',
            300: '#A5B4FC',
            400: '#818CF8',
            500: '#6366F1',
            600: '#4F46E5', // Often used for primary buttons/actions
            700: '#4338CA',
            800: '#3730A3',
            900: '#312E81',
          },
          state: { // Renamed from 'accent' for clarity
            success: '#22C55E', // green-600
            error: '#DC2626',   // red-600
            info: '#2563EB',    // blue-600
            warning: '#F97316', // orange-500
          },
          dark: { // Dark theme specific colors
            bg: '#121214',
            card: '#1E1E24',
          },
          gray: { // Neutral gray scale (Tailwind default)
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827',
            950: '#030712',
          }
        },
        fontFamily: {
          // Using Inter as the base sans-serif font
          sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
          // Defining Poppins specifically for headings (apply with class e.g., font-heading)
          heading: ['Poppins', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
        },
        borderRadius: { // Keeping existing border radius
          'xl': '16px',
          '2xl': '24px',
        },
      }
    },
    plugins: [
      require('tailwind-scrollbar'), // Keeping existing plugin
    ],
  };