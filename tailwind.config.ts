import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        foreground: "var(--text)",
        theme: {
          1: "#ff4d4d",
          2: {
            light: "#a855f7",
            DEFAULT: "#9333ea",
            dark: "#7e22ce",
          },
          3: "#ec4899",
        },
        border: "var(--line)",
      },
      animation: {
        marquee: "marquee var(--duration, 40s) linear infinite",
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(calc(-50% - var(--gap)/2))" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        }
      }
    },
  },
  plugins: [],
}

export default config
