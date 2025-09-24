import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'warm' | 'dark';
  hover?: 'none' | 'lift' | 'glow' | 'scale';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  radius?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    variant = 'default',
    hover = 'lift',
    padding = 'lg',
    radius = 'full',
    className,
    children,
    ...props
  }, ref) => {
    const baseClasses = 'transition-all duration-300';

    const variantClasses = {
      default: 'bg-nordic-white border border-border-light',
      elevated: 'bg-nordic-white border border-border-light shadow-nordic-md',
      warm: 'bg-nordic-warm border border-border-light',
      dark: 'bg-accent-primary text-white border border-accent-primary'
    };

    const hoverClasses = {
      none: '',
      lift: 'hover:shadow-nordic-lg hover:transform hover:-translate-y-1',
      glow: 'hover:shadow-glow hover:border-accent-blue/20',
      scale: 'hover:scale-105'
    };

    const paddingClasses = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-12'
    };

    const radiusClasses = {
      sm: 'rounded-nordic',
      md: 'rounded-nordic-lg',
      lg: 'rounded-nordic-xl',
      xl: 'rounded-nordic-2xl',
      full: 'rounded-3xl'
    };

    const classes = clsx(
      baseClasses,
      variantClasses[variant],
      hoverClasses[hover],
      paddingClasses[padding],
      radiusClasses[radius],
      className
    );

    return React.createElement(
      'div',
      { ...props, ref, className: classes },
      children
    );
  }
);

Card.displayName = 'Card';

// Card sub-components for better composition
export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    React.createElement(
      'div',
      { ...props, ref, className: clsx('flex flex-col space-y-1.5 mb-6', className) }
    )
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    React.createElement(
      'h3',
      { ...props, ref, className: clsx('text-xl font-semibold leading-none tracking-tight text-text-primary', className) }
    )
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    React.createElement(
      'p',
      { ...props, ref, className: clsx('text-text-secondary leading-relaxed', className) }
    )
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    React.createElement(
      'div',
      { ...props, ref, className: clsx('mb-6', className) }
    )
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    React.createElement(
      'div',
      { ...props, ref, className: clsx('flex items-center gap-3 pt-6 mt-6 border-t border-border-light', className) }
    )
  )
);
CardFooter.displayName = 'CardFooter';
