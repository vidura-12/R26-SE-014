/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      colors: {
        cinnamon: {
          50:  '#fdf8f0',
          100: '#faefd9',
          200: '#f4dcb0',
          300: '#ecc07d',
          400: '#e29e48',
          500: '#d4812a',
          600: '#b86620',
          700: '#974f1c',
          800: '#7a3f1e',
          900: '#64341c',
          950: '#371a0c',
        },
        forest: {
          50:  '#f2f8f0',
          100: '#e0f0db',
          200: '#c2e1ba',
          300: '#96cc8e',
          400: '#65b05c',
          500: '#44943b',
          600: '#33762d',
          700: '#2a5d26',
          800: '#244a21',
          900: '#1e3e1c',
          950: '#0f210e',
        },
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-cinnamon': 'linear-gradient(135deg, #d4812a 0%, #b86620 50%, #974f1c 100%)',
        'gradient-forest': 'linear-gradient(135deg, #44943b 0%, #33762d 50%, #2a5d26 100%)',
        'gradient-hero': 'linear-gradient(135deg, rgba(55,26,12,0.85) 0%, rgba(180,102,32,0.6) 100%)',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.14)',
        'glow': '0 0 30px rgba(212,129,42,0.25)',
        'glow-green': '0 0 30px rgba(68,148,59,0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
