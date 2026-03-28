/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        cinzel: ['"Cinzel"', 'serif'],
        'cinzel-deco': ['"Cinzel Decorative"', 'serif'],
        lora: ['"Lora"', 'serif'],
      },
      colors: {
        parchment: { DEFAULT: '#e8d5b0', light: '#f5ead0', dark: '#c4a87a' },
        ink:       { DEFAULT: '#2a1f14', light: '#4a3828', dark: '#1a1008' },
        gold:      { DEFAULT: '#c8962a', light: '#e8b84a', dark: '#8a6a10' },
        blood:     { DEFAULT: '#8a1a1a', light: '#b42424', dark: '#5a0a0a' },
        forest:    { DEFAULT: '#1a4a2a', light: '#2a6a3c', dark: '#0e2e1a' },
        stone:     { DEFAULT: '#3a3530', light: '#5a5048', dark: '#1e1c18' },
        ember:     { DEFAULT: '#c04820', light: '#e0682e', dark: '#802e10' },
        mystic:    { DEFAULT: '#4a2a6a', light: '#6a3a8a', dark: '#2e1a42' },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease forwards',
        'slide-up': 'slideUp 0.5s ease forwards',
        'flicker': 'flicker 3s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'combat-shake': 'combatShake 0.3s ease',
      },
      keyframes: {
        fadeIn:      { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:     { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        flicker:     { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.85' } },
        pulseGold:   { '0%,100%': { boxShadow: '0 0 8px #c8962a40' }, '50%': { boxShadow: '0 0 20px #c8962a80' } },
        combatShake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-6px)' }, '75%': { transform: 'translateX(6px)' } },
      },
      backgroundImage: {
        'parchment-texture': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
