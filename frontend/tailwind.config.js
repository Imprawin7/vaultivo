/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        vault: {
          DEFAULT: 'rgb(var(--color-vault) / <alpha-value>)',
          dark: 'rgb(var(--color-vault-dark) / <alpha-value>)',
          light: 'rgb(var(--color-vault-light) / <alpha-value>)',
        },
        brass: {
          DEFAULT: 'rgb(var(--color-brass) / <alpha-value>)',
          light: 'rgb(var(--color-brass-light) / <alpha-value>)',
        },
        line: 'rgb(var(--color-line) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)'
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
