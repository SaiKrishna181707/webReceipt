import type { Config } from 'tailwindcss'

/**
 * OCEAN DRIVE palette — a 1986 Miami sunset.
 *
 * Two hues carry the whole interface: flamingo neon (#ff2e97) and pool aqua
 * (#2de2e6), thrown against a violet night sky that burns orange at the
 * horizon. Everything else is either the sun (gold), the palms (mint), or
 * chrome.
 *
 * The legacy `plate/stud/brick/azure/lime/tangerine` scales are kept as
 * aliases so no surface can fall back to an off-theme default while the
 * codebase migrates to the neon names.
 */

const NEON = {
  200: '#ffc0e2',
  300: '#ff8ecb',
  400: '#ff5cb0',
  500: '#ff2e97',
  600: '#e60c78',
  700: '#b0055b',
  800: '#750039',
}

const AQUA = {
  200: '#a8fbff',
  300: '#6ff2f7',
  400: '#2de2e6',
  500: '#00c4cc',
  600: '#009aa3',
  700: '#026e77',
  800: '#02474e',
}

const SUNSET = {
  200: '#ffd9a8',
  300: '#ffbb6b',
  400: '#ff9a3c',
  500: '#ff7418',
  600: '#e05605',
  700: '#a83f06',
  800: '#6e2a06',
}

const GOLD = {
  200: '#ffe8b0',
  300: '#ffd166',
  400: '#ffc23c',
  500: '#ffab1a',
  600: '#e08600',
  700: '#a86200',
  800: '#6e4000',
}

/** Mint — the "valid / healed" green, pulled off a 1986 pool tile. */
const MINT = {
  200: '#b6ffd8',
  300: '#7dffb0',
  400: '#35f39a',
  500: '#06d67d',
  600: '#04ab63',
  700: '#047947',
  800: '#03532f',
}

/** Scarface red — failures, broken tubes, integrity alarms. */
const BLOOD = {
  200: '#ffc4d0',
  300: '#ff8fa9',
  400: '#ff5476',
  500: '#ff2d5e',
  600: '#e00b41',
  700: '#a80430',
  800: '#6e0220',
}

/** Violet — the dusk sky and every deep panel shadow. */
const VIOLET = {
  200: '#d5b8ff',
  300: '#b184ff',
  400: '#8b4dff',
  500: '#6a1fd0',
  600: '#4c14a0',
  700: '#340c72',
  800: '#200747',
}

/** Chrome → night: text at the top, backgrounds at the bottom. */
const NIGHT = {
  100: '#f6f3ff',
  200: '#dcd6f2',
  300: '#a79fc4',
  400: '#7d759c',
  500: '#544d75',
  600: '#2a1745',
  700: '#1b1030',
  800: '#120a1e',
  900: '#0a0510',
}

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        foreground: 'var(--text)',
        border: 'var(--line)',

        neon: NEON,
        aqua: AQUA,
        sunset: SUNSET,
        gold: GOLD,
        mint: MINT,
        blood: BLOOD,
        violet: VIOLET,
        vice: VIOLET,
        night: NIGHT,

        // ---- legacy aliases, remapped onto the sunset ------------------
        brick: NEON,
        stud: GOLD,
        azure: AQUA,
        lime: MINT,
        tangerine: SUNSET,
        plate: NIGHT,
        rose: BLOOD,
        amber: GOLD,
      },
      fontFamily: {
        // Kanit carries the headlines: geometric, tropical, and it has a real
        // italic — which is where all the 80s speed comes from.
        display: ['var(--font-display)', 'Kanit', 'system-ui', 'sans-serif'],
        // Monoton is a neon tube. Wordmarks only, never body copy.
        neon: ['Monoton', 'var(--font-display)', 'cursive'],
        mono: ['"Fira Code"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 0 1px rgba(255,46,151,.5), 0 0 18px -2px rgba(255,46,151,.55), 0 0 60px -14px rgba(255,46,151,.5)',
        'neon-sm': '0 0 0 1px rgba(255,46,151,.45), 0 0 10px -1px rgba(255,46,151,.5)',
        aqua: '0 0 0 1px rgba(45,226,230,.5), 0 0 18px -2px rgba(45,226,230,.55), 0 0 60px -14px rgba(45,226,230,.45)',
        gold: '0 0 0 1px rgba(255,194,60,.5), 0 0 18px -2px rgba(255,194,60,.5), 0 0 56px -14px rgba(255,194,60,.4)',
        // Chrome trim: a hot top edge, a dark underside, and a long dusk shadow
        chrome:
          'inset 0 1px 0 rgba(255,255,255,.28), inset 0 -1px 0 rgba(0,0,0,.6), 0 12px 30px -14px rgba(0,0,0,.95)',
        deco: '0 1px 0 rgba(255,255,255,.07) inset, 0 24px 50px -28px rgba(0,0,0,1), 0 0 46px -26px rgba(255,46,151,.7)',
      },
      backgroundImage: {
        'sunset-sky':
          'linear-gradient(180deg,#0a0510 0%,#200747 24%,#4c14a0 44%,#c2247f 66%,#ff5476 78%,#ff9a3c 88%,#ffc23c 100%)',
        chrome:
          'linear-gradient(180deg,#ffffff 0%,#dcd6f2 26%,#a79fc4 48%,#f6f3ff 52%,#7d759c 74%,#dcd6f2 100%)',
        'neon-rule': 'linear-gradient(90deg,transparent,#ff2e97 18%,#ffc23c 50%,#2de2e6 82%,transparent)',
      },
      animation: {
        marquee: 'marquee var(--duration, 40s) linear infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        flicker: 'flicker 6s steps(1, end) infinite',
        'neon-pulse': 'neonPulse 3.2s ease-in-out infinite',
        sway: 'sway 7s ease-in-out infinite',
        'sun-bars': 'sunBars 9s linear infinite',
        scan: 'scan 7s linear infinite',
        'drive-by': 'driveBy 9s linear infinite',
        float: 'floatSlow 5s ease-in-out infinite',
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
        // A tube that never quite settles — the ballast is going.
        flicker: {
          '0%, 41%, 43.5%, 45%, 61%, 63%, 100%': { opacity: '1' },
          '42%, 44%, 62%': { opacity: '.34' },
          '42.5%': { opacity: '.7' },
        },
        neonPulse: {
          '0%, 100%': { filter: 'brightness(1) saturate(1)' },
          '50%': { filter: 'brightness(1.28) saturate(1.2)' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(-1.6deg)' },
          '50%': { transform: 'rotate(1.6deg)' },
        },
        sunBars: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 -64px' },
        },
        scan: {
          '0%': { transform: 'translateY(-110%)' },
          '100%': { transform: 'translateY(110%)' },
        },
        driveBy: {
          '0%': { transform: 'translateX(-12%)', opacity: '0' },
          '8%, 92%': { opacity: '1' },
          '100%': { transform: 'translateX(112%)', opacity: '0' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
