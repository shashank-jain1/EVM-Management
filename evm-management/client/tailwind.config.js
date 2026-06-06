/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: 'var(--color-navy-950, #1e3b68)',
          900: 'var(--color-navy-900, #2b4c7e)',
          800: 'var(--color-navy-800, #3e6294)',
          700: 'var(--color-navy-700, #2563eb)',
          600: 'var(--color-navy-600, #3b82f6)',
          500: 'var(--color-navy-500, #60a5fa)',
        },
        slate: {
          950: 'var(--color-navy-950, #1e3b68)',
          900: 'var(--color-navy-900, #2b4c7e)',
          800: 'var(--color-navy-800, #3e6294)',
          700: 'var(--color-grey-700, #486581)',
        },
        gray: {
          950: 'var(--color-navy-950, #1e3b68)',
          900: 'var(--color-navy-900, #2b4c7e)',
          800: 'var(--color-navy-800, #3e6294)',
          700: 'var(--color-grey-700, #486581)',
        },
        zinc: {
          950: 'var(--color-navy-950, #1e3b68)',
          900: 'var(--color-navy-900, #2b4c7e)',
          800: 'var(--color-navy-800, #3e6294)',
          700: 'var(--color-grey-700, #486581)',
        },
        neutral: {
          950: 'var(--color-navy-950, #1e3b68)',
          900: 'var(--color-navy-900, #2b4c7e)',
          800: 'var(--color-navy-800, #3e6294)',
          700: 'var(--color-grey-700, #486581)',
        },
        saffron: {
          500: '#FF6B00',
          400: '#FF8534',
          300: '#FFA366',
          200: '#FFBF99',
        },
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
        info: '#2563EB',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08)',
        md: '0 4px 16px rgba(0,0,0,0.12)',
        lg: '0 8px 32px rgba(0,0,0,0.16)',
        'navy-sm': '0 1px 3px rgba(10,22,40,0.15)',
        'navy-md': '0 4px 16px rgba(10,22,40,0.20)',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-in-out',
        'slide-up': 'slideUp 250ms ease-out',
        'slide-in-right': 'slideInRight 300ms ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'scan': 'scan 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { transform: 'translateY(16px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideInRight: { from: { transform: 'translateX(16px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        pulseSoft: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
        scan: { '0%': { top: '10%' }, '50%': { top: '90%' }, '100%': { top: '10%' } },
      },
    },
  },
  plugins: [],
};
