const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Base colors
        background: '#FFFFFF',
        foreground: '#262659',
        
        // Primary blue shades
        primary: {
          50: '#E8E8F0',
          100: '#D1D1E1',
          200: '#A3A3C3',
          300: '#7575A5',
          400: '#4747B7',
          500: '#262659', // Main primary
          600: '#1F1F4A',
          700: '#19193B',
          800: '#13132C',
          900: '#0C0C1D',
          DEFAULT: '#262659',
          light: '#3D3D73',
          dark: '#19193B',
        },
        
        // Gold accent
        gold: {
          50: '#FFF9E6',
          100: '#FFF3CC',
          200: '#FFE799',
          300: '#FFDB66',
          400: '#FFCF33',
          500: '#A67C00', // Main gold
          600: '#856300',
          700: '#644A00',
          800: '#433100',
          900: '#221900',
          DEFAULT: '#A67C00',
          light: '#D4A300',
          dark: '#7A5A00',
        },
        
        // Neutral grays
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        
        // Status colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'border-beam': {
          '100%': {
            'offset-distance': '100%',
          },
        },
        'gold-shine': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'border-beam': 'border-beam calc(var(--duration)*1s) infinite linear',
        'gold-shine': 'gold-shine 3s ease-in-out infinite',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(38, 38, 89, 0.08)',
        'glass-hover': '0 12px 40px 0 rgba(38, 38, 89, 0.12)',
        'glass-inset': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.06)',
        'gold-glow': '0 0 20px rgba(166, 124, 0, 0.3)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}; 