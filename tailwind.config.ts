import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          100: '#FAF0D7',
          200: '#F0D898',
          300: '#E5C87A',
          400: '#C9A84C',
          500: '#B08C38',
          600: '#8B6914',
          700: '#5A420A',
        },
        navy: {
          900: '#060D1A',
          800: '#0C1426',
          700: '#111C35',
          600: '#162240',
          500: '#1E2E52',
        },
      },
      fontFamily: {
        hebrew: ['var(--font-heebo)', 'sans-serif'],
      },
      keyframes: {
        pulse_red: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'pulse-red': 'pulse_red 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
