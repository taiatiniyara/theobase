import * as React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'h-12 w-full rounded-lg border bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-400',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-400/20 focus:ring-offset-0 focus:outline-none',
          'disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed',
          'dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500',
          error
            ? 'border-error ring-2 ring-red-300 dark:border-error dark:ring-red-700'
            : 'border-neutral-300 dark:border-neutral-700',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
