/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sakura: {
          root:      '#F7F4EF',
          surface:   '#FDFCF9',
          elevated:  '#FFFFFF',
          subtle:    '#F0EDE8',
          primary:   '#3B3833',
          secondary: '#8B8680',
          tertiary:  '#B8B3AD',
          border:    '#E5E0D9',
          accent:    '#8B9D83',
          'accent-soft': '#DDE4D8',
          success:   '#7A9A7E',
          warning:   '#C9A96E',
          danger:    '#C4887C',
          info:      '#8A9FB8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'card': '12px',
        'btn': '8px',
        'modal': '16px',
      },
      spacing: {
        'card-padding': '20px',
        'card-gap': '16px',
        'section-gap': '32px',
      },
      maxWidth: {
        'content': '960px',
      },
      transitionTimingFunction: {
        'soft': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'fade-in': 'fadeIn 300ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'scale-in': 'scaleIn 250ms ease-out',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}

