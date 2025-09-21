import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const inputVariants = cva(
  // Base styles
  'w-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-text-muted',
  {
    variants: {
      variant: {
        default: 'bg-nordic-cream border-border-medium focus:border-accent-primary focus:ring-accent-primary/20',
        filled: 'bg-nordic-white border-border-light focus:border-accent-primary focus:ring-accent-primary/20',
        outlined: 'bg-transparent border-border-medium focus:border-accent-blue focus:ring-accent-blue/20',
      },
      size: {
        sm: 'px-3 py-2 text-sm rounded-nordic',
        md: 'px-4 py-3 text-base rounded-nordic-lg',
        lg: 'px-6 py-4 text-lg rounded-nordic-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  helper?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, label, error, helper, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-text-primary">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <input
          className={cn(
            inputVariants({ variant, size }),
            error && 'border-error-500 focus:border-error-500 focus:ring-error-500/20',
            className
          )}
          ref={ref}
          {...props}
        />
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

export { Input, inputVariants };
