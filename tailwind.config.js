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
        border: 'var(--color-border)',
        focus: 'var(--color-focus)',
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
        card: '1.25rem',
      },
      boxShadow: {
        card: '0 2px 10px 0 rgb(0 0 0 / 0.08)',
      },
    },
  },
  plugins: [],
};
