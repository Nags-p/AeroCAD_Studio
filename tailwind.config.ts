import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cad: {
          bg: "#F1F5F9",
          panel: "#FFFFFF",
          border: "#E2E8F0",
          hover: "#F8FAFC",
          accent: "#0284C7",
          accentHover: "#0369A1",
          sidebar: "#F8FAFC",
          text: "#0F172A",
          muted: "#64748B",
          gold: "#D97706",
          danger: "#DC2626",
          success: "#059669"
        }
      },
      backdropBlur: {
        xs: "2px",
      }
    },
  },
  plugins: [],
};
export default config;
