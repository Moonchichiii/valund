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

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components for better composition
export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('flex flex-col space-y-1.5 mb-6', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={clsx('text-xl font-semibold leading-none tracking-tight text-text-primary', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={clsx('text-text-secondary leading-relaxed', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx('mb-6', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('flex items-center gap-3 pt-6 mt-6 border-t border-border-light', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';
