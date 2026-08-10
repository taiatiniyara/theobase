import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Spinner } from "./Spinner";

const variants = {
  primary: "bg-brand text-white hover:bg-brand-hover focus-visible:ring-brand",
  secondary:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-brand",
  danger: "bg-danger text-white hover:bg-red-700 focus-visible:ring-danger",
  ghost: "text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400",
  link: "text-brand hover:text-brand-hover underline-offset-4 hover:underline",
} as const;

const sizes = {
  sm: "px-2 py-1 text-xs rounded",
  md: "px-4 py-2 text-sm rounded-md",
  lg: "px-6 py-3 text-base rounded-lg",
  icon: "p-1.5 rounded",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, disabled, children, className = "", ...props },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:opacity-50
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" className="mr-2" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
