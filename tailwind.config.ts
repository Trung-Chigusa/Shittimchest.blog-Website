import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

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
        background: "var(--background)",
        foreground: "var(--foreground)",
        panel: "rgb(11 16 28 / <alpha-value>)",
        electric: {
          cyan: "#38f4ff",
          blue: "#4f8cff",
          violet: "#a66cff",
          pink: "#ff4fd8",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgb(56 244 255 / 0.20)",
        violet: "0 0 44px rgb(166 108 255 / 0.22)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        grid:
          "linear-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.06) 1px, transparent 1px)",
      },
    },
  },
  plugins: [typography],
};
export default config;
