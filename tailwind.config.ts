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
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['"Chakra Petch"', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        lime: {
          DEFAULT: "#a3e635",
          300: "#bef264",
          400: "#a3e635",
          500: "#84cc16",
          900: "#365314",
        },
        carbon: {
          950: "#060709",
          900: "#090a0d",
          850: "#0d0f14",
          800: "#101217",
          750: "#161922",
          700: "#1c2230",
          600: "#2a3244",
          500: "#3d475d",
        },
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        card: {
          DEFAULT: "var(--card-bg)",
          border: "var(--card-border)",
        }
      },
    },
  },
  plugins: [],
};
export default config;


