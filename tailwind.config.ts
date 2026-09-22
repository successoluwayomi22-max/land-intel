import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          darkNavy: "#0B1220",
          navy: "#111C30",
          blue: "#2563EB",
          blueHover: "#1D4ED8",
          lightBlue: "#EFF6FF",
          background: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
          textPrimary: "#0F172A",
          textSecondary: "#64748B",
          textMuted: "#94A3B8",
          success: "#16A34A",
          warning: "#F59E0B",
          danger: "#DC2626",
          slateLight: "#F1F5F9",
        },
        risk: {
          low: "#16A34A",
          moderate: "#2563EB",
          elevated: "#F59E0B",
          high: "#EA580C",
          critical: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["var(--font-urbanist)", "system-ui", "sans-serif"],
        heading: ["var(--font-urbanist)", "system-ui", "sans-serif"],
        urbanist: ["var(--font-urbanist)", "sans-serif"],
      },
      borderRadius: {
        input: "8px",
        card: "12px",
        button: "8px",
        pill: "9999px",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(11, 18, 32, 0.05), 0 1px 2px -1px rgba(11, 18, 32, 0.05)",
        card: "0 4px 6px -1px rgba(11, 18, 32, 0.05), 0 2px 4px -2px rgba(11, 18, 32, 0.05)",
        elevated: "0 10px 15px -3px rgba(11, 18, 32, 0.08), 0 4px 6px -4px rgba(11, 18, 32, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
