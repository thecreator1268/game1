import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  tone?: 'default' | 'primary';
}

export function IconButton({ label, children, tone = 'default', className = '', ...rest }: IconButtonProps) {
  const toneClass =
    tone === 'primary'
      ? 'bg-primary text-primary-text hover:bg-primary-hover'
      : 'bg-surface text-text hover:bg-surface-alt';
  return (
    <button
      aria-label={label}
      title={label}
      className={`tap-target inline-flex items-center justify-center rounded-full shadow-card transition-colors active:scale-[0.96] ${toneClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
