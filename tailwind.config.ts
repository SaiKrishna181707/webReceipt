import type { Config } from 'tailwindcss'

/**
 * THE CONSTRUCT — a Matrix-inspired palette.
 *
 * One hue carries the entire interface: phosphor green, in three intensities.
 *
 *   bright  (#33ff66)  active, verified, the thing you're looking at
 *   mid     (#00b83f)  structure, labels, kickers, borders
 *   dim     (#005c1f)  falling code, grids, everything in the background
 *
 * Two hues exist only to report state and are used sparingly:
 *   amber   warnings — an amber CRT, never a neon orange
 *   red     failures — the one alarm colour in the system
 *
 * Every scale carries a `DEFAULT` so the bare utility (`border-matrix`,
 * `text-matrix`, `bg-matrix/70`) is legal. Without it Tailwind silently emits
 * nothing for those classes, which is how the opening sequence lost its border,
 * its type colour and its scan line at once. The DEFAULT is the 400 step — the
 * one the scale is named for — except `void`, where it is true black.
 */

/** Bright phosphor — the primary accent. Active states and the brand green. */
const GREEN = {
  100: '#e4ffec',
  200: '#b7ffcc',
  300: '#7bffa0',
  400: '#33ff66',
  500: '#00e64a',
  600: '#00b83f',
  700: '#008a30',
  800: '#005c1f',
  900: '#00330f',
}

/** Mid phosphor — structure, kickers, labels. Reads as "system", not "alert". */
const PHOSPHOR = {
  100: '#d3f7dd',
  200: '#a5eab8',
  300: '#6fd68c',
  400: '#3fbf66',
  500: '#1fa049',
  600: '#12803a',
  700: '#0b602b',
  800: '#07401c',
  900: '#04240f',
}

/** Data teal — a second, cooler green for information channels. */
const TEAL = {
  100: '#dbfff5',
  200: '#aefde9',
  300: '#6ff5d4',
  400: '#2fe3ba',
  500: '#00c79c',
  600: '#009e7c',
  700: '#00745c',
  800: '#004b3b',
  900: '#00291f',
}

/** Amber CRT — warnings only. Desaturated on purpose; this is not neon. */
const AMBER = {
  100: '#faf6d8',
  200: '#f0e8ab',
  300: '#e2d472',
  400: '#ccbb45',
  500: '#ab9a2b',
  600: '#877820',
  700: '#645818',
  800: '#413810',
  900: '#241f09',
}

/** Alarm red — integrity failures, rejected repairs, broken collectors. */
const RED = {
  100: '#ffdcdc',
  200: '#ffb3b3',
  300: '#ff8080',
  400: '#ff4d4d',
  500: '#f52222',
  600: '#c41414',
  700: '#920f0f',
  800: '#5e0a0a',
  900: '#330606',
}

/**
 * Void → phosphor text. 900 is true black (the screen is off), 100 is the pale
 * green-white that terminal type is actually printed in.
 */
const VOID = {
  100: '#e8ffee',
  200: '#c2e5ca',
  300: '#86ad91',
  400: '#5e7b66',
  500: '#3f5545',
  600: '#25382a',
  700: '#15231a',
  800: '#080d09',
  900: '#000000',
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
        matrix: { ...GREEN, DEFAULT: GREEN[400] },
        phosphor: { ...PHOSPHOR, DEFAULT: PHOSPHOR[400] },
        data: { ...TEAL, DEFAULT: TEAL[400] },
        warn: { ...AMBER, DEFAULT: AMBER[400] },
        alarm: { ...RED, DEFAULT: RED[400] },
        void: { ...VOID, DEFAULT: VOID[900] },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['var(--font-display)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', '"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        matrix: '0 0 0 1px rgba(51,255,102,.42), 0 0 16px -4px rgba(51,255,102,.5), 0 0 48px -18px rgba(51,255,102,.34)',
        'matrix-sm': '0 0 0 1px rgba(51,255,102,.34), 0 0 10px -3px rgba(51,255,102,.45)',
      },
      backgroundImage: {
        'matrix-rule': 'linear-gradient(90deg,transparent,rgba(51,255,102,.85) 26%,rgba(51,255,102,.85) 74%,transparent)',
      },
      animation: {
        marquee: 'marquee var(--duration, 44s) linear infinite',
        'fade-in-up': 'fadeInUp 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
        scan: 'scanSweep 6s linear infinite',
        float: 'floatSlow 6s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(calc(-50% - var(--gap)/2))' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scanSweep: {
          '0%': { transform: 'translateY(-110%)' },
          '100%': { transform: 'translateY(110%)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
