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
 * The old Vice City scale names are kept as aliases (`neon`, `gold`, `aqua`,
 * `mint`, `blood`, `violet`, `night`, `brick`, `stud`, …) and remapped onto the
 * green system. Nothing can fall back to an off-theme pink or orange, and the
 * product consoles keep working while their call sites migrate.
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
  200: '#a9c9b1',
  300: '#6f8f78',
  400: '#4c6552',
  500: '#334438',
  600: '#1b2a1f',
  700: '#101a13',
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

        // ---- the system ------------------------------------------------
        matrix: GREEN,
        phosphor: PHOSPHOR,
        data: TEAL,
        warn: AMBER,
        alarm: RED,
        void: VOID,

        // ---- legacy scale names, remapped onto the green system --------
        // `neon` and `mint` are the bright phosphor; `gold` is the mid
        // phosphor that used to carry every kicker; `aqua` is the data teal.
        neon: GREEN,
        mint: GREEN,
        gold: PHOSPHOR,
        aqua: TEAL,
        blood: RED,
        rose: RED,
        sunset: AMBER,
        amber: AMBER,
        // Violet was the dusk sky. There is no sky here — it becomes the void.
        violet: VOID,
        vice: VOID,
        night: VOID,
        plate: VOID,
        brick: GREEN,
        stud: PHOSPHOR,
        azure: TEAL,
        lime: GREEN,
        tangerine: AMBER,
      },
      fontFamily: {
        // Inter carries the headlines. The Matrix interface is typographically
        // plain on purpose — the atmosphere comes from the code behind it.
        display: ['var(--font-display)', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        // Every piece of system information is monospaced.
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        // A lit edge plus a short halo. Green light spills; it never fills.
        matrix: '0 0 0 1px rgba(51,255,102,.42), 0 0 16px -4px rgba(51,255,102,.5), 0 0 48px -18px rgba(51,255,102,.34)',
        'matrix-sm': '0 0 0 1px rgba(51,255,102,.34), 0 0 10px -3px rgba(51,255,102,.45)',
        neon: '0 0 0 1px rgba(51,255,102,.42), 0 0 16px -4px rgba(51,255,102,.5), 0 0 48px -18px rgba(51,255,102,.34)',
        'neon-sm': '0 0 0 1px rgba(51,255,102,.34), 0 0 10px -3px rgba(51,255,102,.45)',
        aqua: '0 0 0 1px rgba(47,227,186,.4), 0 0 16px -4px rgba(47,227,186,.45), 0 0 46px -18px rgba(47,227,186,.3)',
        gold: '0 0 0 1px rgba(63,191,102,.4), 0 0 16px -4px rgba(63,191,102,.42), 0 0 44px -18px rgba(63,191,102,.28)',
        alarm: '0 0 0 1px rgba(255,77,77,.42), 0 0 16px -4px rgba(255,77,77,.45)',
        // Panel: hairline top edge, black underside, long fall-off.
        chrome: 'inset 0 1px 0 rgba(51,255,102,.12), inset 0 -1px 0 rgba(0,0,0,.7), 0 14px 34px -16px rgba(0,0,0,1)',
        deco: 'inset 0 1px 0 rgba(51,255,102,.1), 0 24px 50px -28px rgba(0,0,0,1), 0 0 40px -26px rgba(51,255,102,.5)',
      },
      backgroundImage: {
        'matrix-rule': 'linear-gradient(90deg,transparent,rgba(51,255,102,.85) 26%,rgba(51,255,102,.85) 74%,transparent)',
        'neon-rule': 'linear-gradient(90deg,transparent,rgba(51,255,102,.85) 26%,rgba(51,255,102,.85) 74%,transparent)',
        'code-fade': 'linear-gradient(180deg,rgba(51,255,102,.16),transparent)',
        chrome: 'linear-gradient(180deg,#e8ffee 0%,#a9c9b1 46%,#e8ffee 52%,#4c6552 100%)',
        'sunset-sky': 'linear-gradient(180deg,#000000 0%,#04240f 46%,#000000 100%)',
      },
      animation: {
        marquee: 'marquee var(--duration, 44s) linear infinite',
        'fade-in-up': 'fadeInUp 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
        // A tube that never quite settles — kept for the wordmark flicker.
        flicker: 'flicker 7s steps(1, end) infinite',
        'neon-pulse': 'phosphorPulse 3.4s ease-in-out infinite',
        scan: 'scanSweep 6s linear infinite',
        'scan-once': 'scanSweep 0.62s cubic-bezier(0.4,0,0.2,1) 1',
        'caret-blink': 'caretBlink 1.05s steps(1, end) infinite',
        float: 'floatSlow 6s ease-in-out infinite',
        'grid-drift': 'gridDrift 26s linear infinite',
        sway: 'sway 8s ease-in-out infinite',
        'sun-bars': 'phosphorPulse 3.4s ease-in-out infinite',
        'drive-by': 'marquee var(--duration, 44s) linear infinite',
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
        flicker: {
          '0%, 46%, 47.6%, 49%, 71%, 72.4%, 100%': { opacity: '1' },
          '46.8%, 48.2%, 71.7%': { opacity: '.42' },
          '47%': { opacity: '.78' },
        },
        phosphorPulse: {
          '0%, 100%': { opacity: '.72' },
          '50%': { opacity: '1' },
        },
        scanSweep: {
          '0%': { transform: 'translateY(-110%)' },
          '100%': { transform: 'translateY(110%)' },
        },
        caretBlink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        gridDrift: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 640px' },
        },
        sway: {
          '0%, 100%': { transform: 'translateX(-1px)' },
          '50%': { transform: 'translateX(1px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
