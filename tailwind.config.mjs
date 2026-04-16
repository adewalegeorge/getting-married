/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          100: '#fdf5dc',
          200: '#f7e8a4',
          300: '#e8cc6a',
          400: '#d4b040',
          500: '#c69a2a',   /* primary gold */
          600: '#a8821f',
          700: '#8a6a18',
        },
        dark: {
          900: '#1e0b3d',   /* deep royal purple */
          800: '#2a1054',   /* mid royal purple */
          700: '#3d1f70',   /* lighter royal purple */
        },
        warm: {
          50:  '#fffdf9',
          100: '#fdf9f3',
          200: '#faf4ec',
          300: '#f5ece0',
          400: '#ecddd0',
        },
      },
      fontFamily: {
        script:  ['"Cormorant Garamond"', 'Georgia', 'serif'],
        serif:   ['"Cormorant Garamond"', 'Georgia', 'serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:    ['"Lora"',               'Georgia', 'serif'],
      },
      backgroundImage: {
        'gold-gradient':      'linear-gradient(135deg, #d4a574, #d4a59a)',
        'gold-gradient-soft': 'linear-gradient(135deg, #e8b888, #d4a59a)',
        'dark-hero':          'linear-gradient(to bottom, rgba(30,11,61,0.65) 0%, rgba(30,11,61,0.35) 50%, rgba(30,11,61,0.8) 100%)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '1.75rem',
      },
      boxShadow: {
        'card':   '0 20px 60px -10px rgba(0,0,0,0.12)',
        'card-lg':'0 35px 80px -15px rgba(0,0,0,0.18)',
        'gold':   '0 8px 30px rgba(198,154,42,0.35)',
        'gold-lg':'0 12px 40px rgba(198,154,42,0.45)',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        pulse:  { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.03)' } },
      },
      animation: {
        'fade-up': 'fadeUp 0.9s ease forwards',
        'fade-in': 'fadeIn 1.1s ease forwards',
        'heartbeat':'pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
