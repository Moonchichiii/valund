import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    className,
    children,
    ...restProps
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      primary: 'bg-accent-primary text-white hover:bg-[#243342] focus:ring-accent-primary/20 hover:transform hover:scale-105 shadow-sm',
      secondary: 'bg-transparent text-text-primary border-2 border-border-medium hover:bg-nordic-warm hover:border-accent-blue focus:ring-accent-blue/20',
      ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-nordic-warm focus:ring-accent-blue/20',
      success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500/20 shadow-sm',
      warning: 'bg-warning-600 text-white hover:bg-warning-700 focus:ring-warning-500/20 shadow-sm',
      danger: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500/20 shadow-sm'
    };

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm rounded-xl',
      md: 'px-6 py-3 text-sm rounded-nordic-xl',
      lg: 'px-8 py-4 text-base rounded-nordic-2xl',
      xl: 'px-10 py-5 text-lg rounded-nordic-2xl'
    };

    const classes = clsx(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      {
        'pointer-events-none': loading,
      },
      className
    );

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled ?? loading}
        {...restProps}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
