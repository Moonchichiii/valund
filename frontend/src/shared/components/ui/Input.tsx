import React from 'react';
import { clsx } from 'clsx';

// Fix the interface conflict by omitting the HTML 'size' attribute
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg'; // Now this won't conflict with HTML size attribute
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    variant = 'default',
    size = 'md',
    label,
    error,
    helper,
    leftIcon,
    rightIcon,
    className,
    id,
    ...restProps
  }, ref) => {
    const inputId = id ?? `input-${Math.random().toString(36).substring(2, 11)}`;

    const baseClasses = 'w-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-text-muted text-text-primary';

    const variantClasses = {
      default: 'bg-nordic-cream border-border-medium focus:border-accent-primary focus:ring-accent-primary/20',
      filled: 'bg-nordic-white border-border-light focus:border-accent-primary focus:ring-accent-primary/20',
      outlined: 'bg-transparent border-border-medium focus:border-accent-blue focus:ring-accent-blue/20'
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm rounded-nordic',
      md: 'px-4 py-3 text-base rounded-nordic-lg',
      lg: 'px-6 py-4 text-lg rounded-nordic-xl'
    };

    const inputClasses = clsx(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      {
        'border-error-500 focus:border-error-500 focus:ring-error-500/20': error,
        'pl-12': leftIcon,
        'pr-12': rightIcon
      },
      className
    );

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-primary">
            {label}
            {restProps.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            {...restProps}
          />

          {rightIcon && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-muted">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-error-500">{error}</p>
        )}

        {helper && !error && (
          <p className="text-sm text-text-muted">{helper}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
