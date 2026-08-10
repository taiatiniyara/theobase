import { type HTMLAttributes } from "react";

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-4",
};

export function Spinner({ size = "md", className = "", ...props }: SpinnerProps) {
  return (
    <div role="status" className={`flex items-center justify-center ${className}`} {...props}>
      <div
        className={`animate-spin rounded-full border-brand border-t-transparent ${sizeClasses[size]}`}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
