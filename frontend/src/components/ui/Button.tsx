import React, { ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'relative inline-flex items-center justify-center font-medium rounded-card focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-brand-600 text-surface hover:bg-brand-700 active:bg-brand-800 border border-transparent',
    secondary: 'bg-surface-muted text-ink-900 hover:bg-surface-border border border-surface-border',
    ghost: 'bg-transparent text-ink-700 hover:bg-surface-muted border border-transparent',
    danger: 'bg-state-danger text-surface hover:bg-red-800 border border-transparent'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const classes = [
    baseClasses,
    variants[variant],
    sizes[size],
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      <span className={isLoading ? 'opacity-0' : ''}>{children}</span>
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" />
        </span>
      )}
    </button>
  );
};
