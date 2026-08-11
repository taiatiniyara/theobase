import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300',
        success: 'bg-success-light text-success-700 dark:bg-green-900/30 dark:text-green-400',
        warning: 'bg-warning-light text-warning-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        error: 'bg-error-light text-error-700 dark:bg-red-900/30 dark:text-red-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
