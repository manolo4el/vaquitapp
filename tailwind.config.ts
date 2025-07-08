import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      xs: "475px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#8B4513", // Saddle Brown
          foreground: "#FFFFFF",
          50: "#F5E6D3",
          100: "#E8D0B3",
          200: "#D4B896",
          300: "#C0A079",
          400: "#A6875C",
          500: "#8B4513",
          600: "#7A3D11",
          700: "#68350F",
          800: "#562D0D",
          900: "#44250B",
        },
        secondary: {
          DEFAULT: "#DEB887", // Burlywood
          foreground: "#4A4A4A",
          50: "#F9F5F0",
          100: "#F2E8D9",
          200: "#E8D5B8",
          300: "#DEB887",
          400: "#D4A574",
          500: "#CA9261",
          600: "#B8834E",
          700: "#A6743B",
          800: "#946528",
          900: "#825615",
        },
        accent: {
          DEFAULT: "#90EE90", // Light Green
          foreground: "#2D5016",
          50: "#F0FFF0",
          100: "#E6FFE6",
          200: "#CCFFCC",
          300: "#B3FFB3",
          400: "#99FF99",
          500: "#90EE90",
          600: "#7FDD7F",
          700: "#6ECC6E",
          800: "#5DBB5D",
          900: "#4CAA4C",
        },
        muted: {
          DEFAULT: "#F5F5DC", // Beige
          foreground: "#6B5B47",
        },
        destructive: {
          DEFAULT: "#DC143C",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#FFFEF7", // Ivory
          foreground: "#4A4A4A",
        },
        popover: {
          DEFAULT: "#FFFEF7",
          foreground: "#4A4A4A",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        bounce: {
          "0%, 100%": {
            transform: "translateY(-25%)",
            animationTimingFunction: "cubic-bezier(0.8,0,1,1)",
          },
          "50%": {
            transform: "none",
            animationTimingFunction: "cubic-bezier(0,0,0.2,1)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        bounce: "bounce 1s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
