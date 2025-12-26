import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // ===========================================
        // NEW AMARI BRAND COLORS (Cozy Modern)
        // ===========================================
        amari: {
          charcoal: '#2D3436',      // Primary text, headings
          terracotta: '#E07A5F',    // Primary CTA, accents
          sage: '#81B29A',          // Success, secondary accent
          cream: '#FAF7F2',         // Page background (light)
          white: '#FFFFFF',         // Cards, surfaces
          muted: '#9A8C7D',         // Secondary text, borders
          rose: '#D4A5A5',          // Subtle highlights
          sand: '#E8E2D9',          // Borders, dividers
          // Dark mode variants
          night: '#1A1D1E',         // Dark mode background
          surface: '#252829',       // Dark mode cards
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'flutter': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '25%': { transform: 'translateY(-10px) rotate(5deg)' },
          '75%': { transform: 'translateY(-5px) rotate(-5deg)' },
        },
        'glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'flutter': 'flutter 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      fontFamily: {
        // NEW: Amari brand fonts
        display: ['var(--font-fraunces)', 'Fraunces', 'serif'],
        body: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
        // LEGACY: keeping for migration
        playfair: ['var(--font-playfair)', 'serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
