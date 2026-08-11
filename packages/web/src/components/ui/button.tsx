import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] min-h-12',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800:bg-brand-500',
        secondary:
          'bg-white text-neutral-700 shadow-sm border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100:bg-neutral-700',
        ghost:
          'text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200:bg-neutral-800',
        destructive:
          'bg-error text-white shadow-sm hover:bg-error-700 active:bg-red-800:bg-red-700',
      },
      size: {
        sm: 'h-8 px-3 text-xs touch-target-min',
        default: 'h-12 px-5 text-sm',
        lg: 'h-14 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
