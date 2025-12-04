/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      colors: {
        // Map Tailwind's standard colors to our custom variables
        border: "hsl(var(--border))",
        input: "hsl(var(--border))",
        ring: "hsl(var(--brand))",
        background: "hsl(var(--bg))",
        foreground: "hsl(var(--ink))",
        primary: {
          DEFAULT: "hsl(var(--brand))",
          foreground: "hsl(var(--bg))",
        },
        secondary: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--bg))",
        },
        destructive: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--bg))",
        },
        muted: {
          DEFAULT: "hsl(var(--bg-soft))",
          foreground: "hsl(var(--ink-muted))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--bg))",
        },
        popover: {
          DEFAULT: "hsl(var(--bg-elevated))",
          foreground: "hsl(var(--ink))",
        },
        card: {
          DEFAULT: "hsl(var(--bg-elevated))",
          foreground: "hsl(var(--ink))",
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
