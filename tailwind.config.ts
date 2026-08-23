import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#062B23',
          dark: '#05201A',
          soft: '#385341',
        },
        accent: {
          DEFAULT: '#B58238',
          dark: '#AB8043',
          light: '#FFBC7D',
        },
        neutral: {
          bg: '#F7F6F3',
          100: '#EFECEC',
          200: '#D9D9D9',
          muted: '#5B6660',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-sans)'],
      },
    },
  },
  plugins: [],
};

export default config;
