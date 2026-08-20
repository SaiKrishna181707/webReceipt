import type { Config } from 'tailwindcss'

/**
 * Brick Lab palette — sampled from real LEGO ABS colour names so the whole
 * interface reads as one moulded set rather than a generic dark dashboard.
 */
const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        foreground: 'var(--text)',
        border: 'var(--line)',

        // Bright Red — the primary action brick
        brick: {
          200: '#ff9a9f',
          300: '#ff6b72',
          400: '#ff3b45',
          500: '#e3000b',
          600: '#c4000a',
          700: '#9c0008',
          800: '#750006',
        },
        // Bright Yellow — labels, kickers, the "new set" energy
        stud: {
          200: '#ffe98a',
          300: '#ffdf52',
          400: '#ffd21e',
          500: '#f6c500',
          600: '#d4a600',
          700: '#a37f00',
          800: '#7a5f00',
        },
        // Bright Blue
        azure: {
          200: '#8fc4ff',
          300: '#54a5ff',
          400: '#1f88ff',
          500: '#0057a8',
          600: '#004a8f',
          700: '#003a70',
          800: '#002b53',
        },
        // Bright Green
        lime: {
          200: '#8ce8a4',
          300: '#4bd971',
          400: '#22c24d',
          500: '#00852b',
          600: '#017024',
          700: '#01571c',
          800: '#014015',
        },
        // Bright Orange — warnings, mutations
        tangerine: {
          200: '#ffc48f',
          300: '#ffa85c',
          400: '#ff8a2b',
          500: '#ff6a13',
          600: '#e2530a',
          700: '#b13e06',
          800: '#822c04',
        },
        // Medium / Dark Stone Grey — the plate the set is built on
        plate: {
          100: '#e8e9e4',
          200: '#c8cac2',
          300: '#9ba09a',
          400: '#6c6e68',
          500: '#4a4c48',
          600: '#33352f',
          700: '#232420',
          800: '#171814',
          900: '#0d0e0b',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Moulded-plastic bevel: hot top edge, dark bottom edge, cast shadow
        brick: 'inset 0 2px 0 rgba(255,255,255,.34), inset 0 -3px 0 rgba(0,0,0,.42), 0 6px 0 -1px rgba(0,0,0,.45), 0 14px 26px -10px rgba(0,0,0,.75)',
        'brick-sm':
          'inset 0 1px 0 rgba(255,255,255,.28), inset 0 -2px 0 rgba(0,0,0,.4), 0 3px 0 -1px rgba(0,0,0,.45), 0 8px 16px -8px rgba(0,0,0,.7)',
        'brick-lg':
          'inset 0 3px 0 rgba(255,255,255,.38), inset 0 -5px 0 rgba(0,0,0,.45), 0 10px 0 -2px rgba(0,0,0,.5), 0 28px 50px -18px rgba(0,0,0,.85)',
        'brick-pressed':
          'inset 0 2px 0 rgba(255,255,255,.2), inset 0 -1px 0 rgba(0,0,0,.4), 0 1px 0 -1px rgba(0,0,0,.45)',
      },
      animation: {
        marquee: 'marquee var(--duration, 40s) linear infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'brick-drop': 'brickDrop 0.7s cubic-bezier(.2,1.5,.4,1) backwards',
        'brick-bob': 'brickBob 5s ease-in-out infinite',
        'stud-spin': 'studSpin 18s linear infinite',
        'clutch-pulse': 'clutchPulse 2.4s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(calc(-50% - var(--gap)/2))' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        brickDrop: {
          '0%': { opacity: '0', transform: 'translate3d(0,-140px,0) rotateX(38deg) scale(.86)' },
          '60%': { opacity: '1' },
          '100%': { opacity: '1', transform: 'translate3d(0,0,0) rotateX(0) scale(1)' },
        },
        brickBob: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-9px) rotate(-1.2deg)' },
        },
        studSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        clutchPulse: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 0 rgba(246,197,0,0))' },
          '50%': { opacity: '.72', filter: 'drop-shadow(0 0 14px rgba(246,197,0,.55))' },
        },
      },
    },
  },
  plugins: [],
}

export default config
