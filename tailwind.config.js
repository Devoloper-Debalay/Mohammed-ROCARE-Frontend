/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: 'var(--color-ink)',
          soft: 'var(--color-ink-soft)',
        },
        base: 'var(--color-base)',
        surface: 'var(--color-surface)',
        teal: {
          DEFAULT: 'var(--color-teal)',
          deep: 'var(--color-teal-deep)',
          tint: 'var(--color-teal-tint)',
        },
        orange: {
          DEFAULT: 'var(--color-orange)',
          deep: 'var(--color-orange-deep)',
          tint: 'var(--color-orange-tint)',
        },
        slate: {
          DEFAULT: 'var(--color-slate)',
          deep: 'var(--color-slate-deep)',
          tint: 'var(--color-slate-tint)',
        },
        gold: {
          DEFAULT: 'var(--color-gold)',
          deep: 'var(--color-gold-deep)',
          tint: 'var(--color-gold-tint)',
        },
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '1.25rem',
      },
    },
  },
  plugins: [],
}
