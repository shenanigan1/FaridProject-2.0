/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts,scss}',
    '../../libs/shared/**/*.{html,ts,scss}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        border: '#1e293b',
        primary: {
          400: '#4a8eff',
          500: '#3b82f6',
        },
        surface: {
          1: '#1e293b',
          2: '#0f172a',
          3: '#272a32',
        },
        text: {
          primary: '#f8fafc',
          secondary: '#c1c6d7',
          muted: '#94a3b8',
          disabled: '#667180',
        },
      },
    },
  },
  plugins: [],
};
