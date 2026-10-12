import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Navy chrome and text
        ink: {
          DEFAULT: "#14213D",
          700: "#2B3A5E",
          500: "#5B6B8C",
          300: "#A9B3C9",
          100: "#E4E8F1",
          50: "#F3F5F9",
        },
        // Seal crimson: primary actions, upvotes, BSCS
        seal: {
          DEFAULT: "#B3202F",
          dark: "#8E1824",
          light: "#FBE9EB",
          soft: "#FF8A95",
        },
        // One color per year level. Used as the left bar on every material.
        year: {
          1: "#3FA38A",
          2: "#D9A92B",
          3: "#DE7B48",
          4: "#7C62BD",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [typography],
};

export default config;
