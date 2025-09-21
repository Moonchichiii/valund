import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const cardVariants = cva(
  // Base styles
  'transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-nordic-white border border-border-light',
        elevated: 'bg-nordic-white border border-border-light shadow-nordic-md',
        warm: 'bg-nordic-warm border border-border-light',
        dark: 'bg-accent-primary text-white border border-accent-primary',
      },
      hover: {
        none: '',
        lift: 'hover:shadow-nordic-lg hover:transform hover:-translate-y-1',
        glow: 'hover:shadow-glow hover:border-accent-blue/20',
        scale: 'hover:scale-105',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-12',
      },
      radius: {
        none: 'rounded-none',
        sm: 'rounded-nordic',
        md: 'rounded-nordic-lg',
        lg: 'rounded-nordic-xl',
        xl: 'rounded-nordic-2xl',
        full: 'rounded-3xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: 'lift',
      padding: 'lg',
      radius: 'full',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, padding, radius, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, hover, padding, radius, className }))}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

// Card sub-components for better composition
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 mb-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-semibold leading-none tracking-tight text-text-primary', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-text-secondary leading-relaxed', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mb-6', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center space-x-3', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants };
