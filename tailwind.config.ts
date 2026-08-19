import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        foreground: "var(--text)",
        card: {
          DEFAULT: "var(--panel)",
          foreground: "var(--text)",
        },
        primary: {
          DEFAULT: "var(--blue)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "var(--panel2)",
          foreground: "var(--text)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--text)",
        },
        accent: {
          DEFAULT: "var(--purple)",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "var(--red)",
          foreground: "#ffffff",
        },
        border: "var(--line)",
        input: "var(--line2)",
        ring: "var(--blue)",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [],
}

export default config
