/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-alt': 'var(--color-surface-alt)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'primary-text': 'var(--color-primary-text)',
        accent: 'var(--color-accent)',
        'accent-text': 'var(--color-accent-text)',
        success: 'var(--color-success)',
        'success-text': 'var(--color-success-text)',
        danger: 'var(--color-danger)',
        'danger-text': 'var(--color-danger-text)',
        warn: 'var(--color-warn)',
        'warn-text': 'var(--color-warn-text)',
        border: 'var(--color-border)',
        focus: 'var(--color-focus)',
        'chip-pink': 'var(--chip-pink)',
      },
      fontSize: {
        body: ['1.125rem', { lineHeight: '1.65' }],
        'body-lg': ['1.25rem', { lineHeight: '1.6' }],
        action: ['1.375rem', { lineHeight: '1.35' }],
        'action-lg': ['1.5rem', { lineHeight: '1.3' }],
        heading: ['1.75rem', { lineHeight: '1.3' }],
        'heading-lg': ['2.125rem', { lineHeight: '1.25' }],
      },
      spacing: {
        tap: '4rem',
      },
      minHeight: {
        tap: '4rem',
      },
      minWidth: {
        tap: '4rem',
      },
      borderRadius: {
        chip: '0.875rem',
        card: '1.625rem',
        // One-corner-squared motif, reused everywhere something should
        // read as "hand-set" rather than uniformly rounded: speech-bubble
        // tags, domain swatches/legend chips.
        tag: '16px 16px 16px 0px',
        swatch: '8px 8px 8px 2px',
        nav: '22px',
      },
      boxShadow: {
        // Hard, single-direction offset shadow (no blur) — reads as a
        // cut-paper sticker, not a soft clay surface. Three sizes: pills
        // get the smallest, cards the default, and hero/"Today's Set"
        // cards the largest. CSS custom property so it adapts per
        // theme/dark mode without a second copy of this value living in JS.
        'card-sm': '0 4px 0 var(--shadow-flat-color)',
        card: '0 5px 0 var(--shadow-flat-color)',
        'card-lg': '0 7px 0 var(--shadow-flat-color)',
      },
      fontFamily: {
        heading: ['Unbounded', '"Noto Sans"', 'system-ui', 'sans-serif'],
        body: ['"Space Grotesk"', '"Noto Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
