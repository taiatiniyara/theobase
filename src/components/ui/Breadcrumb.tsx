import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export function Breadcrumb({ children }: { children: ReactNode }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm">
      <ol className="flex items-center gap-1.5">{children}</ol>
    </nav>
  );
}

export function BreadcrumbItem({
  to,
  children,
  isLast = false,
}: {
  to?: string;
  children: ReactNode;
  isLast?: boolean;
}) {
  if (isLast) {
    return (
      <li className="truncate text-gray-500" aria-current="page">
        {children}
      </li>
    );
  }

  if (to) {
    return (
      <li className="truncate">
        <Link to={to} className="text-brand hover:text-brand-hover">
          {children}
        </Link>
      </li>
    );
  }

  return <li className="truncate text-gray-500">{children}</li>;
}

export function BreadcrumbSeparator() {
  return (
    <li className="text-gray-400 select-none" aria-hidden="true">
      /
    </li>
  );
}
