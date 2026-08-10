import * as React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'h-12 w-full rounded-md border border-neutral-300 bg-white px-4 text-base text-neutral-900 placeholder:text-neutral-400',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-400 focus:ring-offset-0 focus:outline-none',
          'disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed',
          'dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500',
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
