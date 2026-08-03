/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-space)', 'sans-serif'],
      },
      colors: {
        background: 'var(--background)',
        surface: {
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
          4: 'var(--surface-4)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: {
          default: 'var(--border-default)',
          hover: 'var(--border-hover)',
        },
        attestly: {
          500: 'var(--attestly-teal)',
          400: 'var(--attestly-teal-light)',
          emerald: 'var(--attestly-emerald-light)',
        },
        accent: {
          amber: 'var(--accent-amber)',
          rose: 'var(--accent-rose)',
        }
      },
    },
  },
  plugins: [],
};
