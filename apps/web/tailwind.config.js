/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
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
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#7C3AED",
          foreground: "#0B041A",
        },
        secondary: {
          DEFAULT: "#FF8B3D",
          foreground: "#1C0B27",
        },
        accent: {
          DEFAULT: "#2DD6B5",
          foreground: "#041215",
        },
        success: {
          DEFAULT: "#15C972",
          foreground: "#021F12",
        },
        warning: {
          DEFAULT: "#FFC542",
          foreground: "#1F1607",
        },
        destructive: {
          DEFAULT: "#FF4D67",
          foreground: "#1F0206",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          purple: "#7C3AED",
          pink: "#FF5EA9",
          gold: "#FFC542",
          navy: "#0B041A",
        },
      },
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg, #7C3AED 0%, #FF5EA9 45%, #FFC542 100%)",
        "gradient-secondary":
          "linear-gradient(135deg, rgba(44,21,73,0.92) 0%, rgba(12,6,28,0.92) 100%)",
        "gradient-card":
          "linear-gradient(145deg, rgba(124,58,237,0.12) 0%, rgba(45,214,181,0.08) 100%)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        glow: "0 0 45px rgba(124, 58, 237, 0.35)",
        "glow-sm": "0 0 25px rgba(45, 214, 181, 0.25)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

module.exports = config;
