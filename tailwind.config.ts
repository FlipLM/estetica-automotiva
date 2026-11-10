import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        "page-title": ["1.625rem", { lineHeight: "2.125rem", fontWeight: "700", letterSpacing: "-0.02em" }], // 26px
        "section-title": ["1.125rem", { lineHeight: "1.625rem", fontWeight: "600", letterSpacing: "-0.01em" }], // 18px
        "card-title": ["0.9375rem", { lineHeight: "1.375rem", fontWeight: "600" }], // 15px
        "body-main": ["0.875rem", { lineHeight: "1.375rem", fontWeight: "400" }], // 14px
        "body-sec": ["0.8125rem", { lineHeight: "1.25rem", fontWeight: "400" }], // 13px
        "caption": ["0.75rem", { lineHeight: "1.125rem", fontWeight: "500" }], // 12px
      },
      colors: {
        background: "var(--bg-app)",
        foreground: "var(--text-primary)",
        brand: {
          DEFAULT: "#247653",
          deep: "#142D26",
          primary: "#247653",
          secondary: "#318B63",
          soft: "#E9F3EC",
          50: "#E9F3EC",
          100: "#D2E7D9",
          200: "#A8D1B8",
          300: "#7AB894",
          400: "#4FA075",
          500: "#318B63",
          600: "#247653",
          700: "#1D5E42",
          800: "#174633",
          900: "#142D26",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          app: "#F7F8F6",
          card: "#FFFFFF",
          muted: "#F1F3F1",
          hover: "#F7F8F6",
          border: "#E7EAE7",
        },
        ink: {
          DEFAULT: "#252B27",
          primary: "#252B27",
          secondary: "#737D75",
          muted: "#9CA49E",
          graphite: "#343C36",
        },
        semantic: {
          success: "#16A36A",
          "success-bg": "#ECFDF5",
          "success-border": "#A7F3D0",
          info: "#2563EB",
          "info-bg": "#EFF6FF",
          "info-border": "#BFDBFE",
          warning: "#D97706",
          "warning-bg": "#FFFBEB",
          "warning-border": "#FDE68A",
          error: "#DC4C4C",
          "error-bg": "#FEF2F2",
          "error-border": "#FECACA",
        },
        // Mapeamento de suporte para transições suaves
        lime: {
          DEFAULT: "#247653",
          300: "#318B63",
          400: "#247653",
          500: "#1D5E42",
          900: "#E9F3EC",
        },
        carbon: {
          950: "#F7F8F6",
          900: "#FFFFFF",
          850: "#FFFFFF",
          800: "#F1F3F1",
          750: "#E7EAE7",
          700: "#E7EAE7",
          600: "#D5DBD5",
          500: "#9CA49E",
        },
        primary: {
          50: "#E9F3EC",
          100: "#D2E7D9",
          500: "#318B63",
          600: "#247653",
          700: "#142D26",
        },
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        input: "8px",
        modal: "16px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(20, 45, 38, 0.04), 0 1px 2px -1px rgba(20, 45, 38, 0.03)",
        "card-hover": "0 4px 12px -2px rgba(20, 45, 38, 0.08), 0 2px 4px -2px rgba(20, 45, 38, 0.04)",
        modal: "0 20px 25px -5px rgba(20, 45, 38, 0.12), 0 8px 10px -6px rgba(20, 45, 38, 0.06)",
        dropdown: "0 10px 15px -3px rgba(20, 45, 38, 0.08), 0 4px 6px -4px rgba(20, 45, 38, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
