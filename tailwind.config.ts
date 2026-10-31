import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        credit: { // Aapne diye / You gave (Red)
          DEFAULT: "#ef4444",
          light: "#fee2e2",
          dark: "#b91c1c",
        },
        debit: { // Aapko mile / You got (Green)
          DEFAULT: "#16a34a",
          light: "#dcfce7",
          dark: "#15803d",
        }
      },
    },
  },
  plugins: [],
};
export default config;
