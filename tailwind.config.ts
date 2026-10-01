import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: token("surface"),
        "surface-2": token("surface-2"),
        line: token("line"),
        fg: token("fg"),
        muted: token("muted"),
        subtle: token("subtle"),
        primary: {
          DEFAULT: token("primary"),
          fg: token("primary-fg"),
          soft: token("primary-soft"),
        },
        accent: token("accent"),
        halo: token("halo"),
        success: token("success"),
        warning: token("warning"),
        danger: token("danger"),
        // "Element" palette used to colour-code categories
        el: {
          spectro: "#f2d27a",
          havoc: "#c264ff",
          aero: "#5ee3b1",
          electro: "#9c8cff",
          fusion: "#ff6a55",
          glacio: "#62c8ff",
        },
      },
      // Game HUDs use crisp edges; keep only a hint of rounding.
      borderRadius: {
        sm: "1px",
        DEFAULT: "2px",
        md: "2px",
        lg: "3px",
        xl: "3px",
        "2xl": "4px",
        "3xl": "6px",
      },
      boxShadow: {
        card: "0 0 0 1px rgb(var(--line) / 0.6), 0 18px 40px -24px rgb(0 0 0 / 0.9)",
        lift: "0 0 0 1px rgb(var(--primary) / 0.35), 0 30px 60px -30px rgb(0 0 0 / 0.95), 0 0 40px -12px rgb(var(--primary) / 0.35)",
        glow: "0 0 0 1px rgb(var(--primary) / 0.5), 0 0 28px -4px rgb(var(--primary) / 0.55)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "Hiragino Sans", "Noto Sans JP", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        spin: { to: { transform: "rotate(360deg)" } },
        "spin-rev": { to: { transform: "rotate(-360deg)" } },
        sweep: {
          "0%": { transform: "translateX(-120%) skewX(-20deg)" },
          "100%": { transform: "translateX(220%) skewX(-20deg)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "45%": { opacity: "0.85" },
          "50%": { opacity: "0.4" },
          "55%": { opacity: "0.9" },
        },
        "float-up": {
          "0%": { opacity: "0", transform: "translate(-50%, 0) scale(0.8)" },
          "15%": { opacity: "1", transform: "translate(-50%, -8px) scale(1)" },
          "100%": { opacity: "0", transform: "translate(-50%, -48px) scale(1)" },
        },
        pulse: { "50%": { opacity: "0.4" } },
        scan: { from: { transform: "translateY(-100%)" }, to: { transform: "translateY(100vh)" } },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.3s ease-out both",
        "slide-in-right": "slide-in-right 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "spin-slow": "spin 40s linear infinite",
        "spin-slower": "spin 80s linear infinite",
        "spin-rev": "spin-rev 60s linear infinite",
        sweep: "sweep 1.1s cubic-bezier(0.22, 1, 0.36, 1)",
        flicker: "flicker 3s linear infinite",
        "float-up": "float-up 1.2s ease-out forwards",
        scan: "scan 8s linear infinite",
      },
    },
  },
  plugins: [typography],
};
export default config;
