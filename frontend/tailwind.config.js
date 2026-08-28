/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14231F',        // near-black deep vault green — primary text, dark chrome
        paper: '#F6F4EE',      // warm ledger-paper background
        surface: '#FFFFFF',    // cards/panels on top of paper
        vault: {
          DEFAULT: '#1F4B43',  // deep vault-door green — primary action color
          dark: '#14332D',
          light: '#2E6B60',
        },
        brass: {
          DEFAULT: '#B7893F',  // brass accent — used sparingly (active states, star, badges)
          light: '#D6B378',
        },
        line: '#E3DECF',       // hairline dividers, ledger-rule color
        danger: '#A23B2E',     // muted brick red for destructive actions
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        ticket: '4px', // small, deliberate — not the generic rounded-2xl card look
      },
    },
  },
  plugins: [],
};
