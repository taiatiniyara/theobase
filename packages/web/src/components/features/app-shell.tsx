import { type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useAuth } from '../../lib/auth-store';
import { cn } from '../../lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  minRole: string | null;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Home', icon: '⌂', minRole: null },
  { path: '/members', label: 'Members', icon: '👥', minRole: 'clerk' },
  { path: '/households', label: 'Households', icon: '🏠', minRole: 'clerk' },
];

const ROLE_HIERARCHY: Record<string, number> = {
  clerk: 1,
  operator: 2,
};

function hasMinRole(userRole: string | null, minRole: string | null): boolean {
  if (!minRole) return true;
  if (!userRole) return false;
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 0);
}

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { churchName, role, email, logout } = useAuth();
  const { location } = useRouterState();
  const currentPath = location.pathname;

  return (
    <div className="flex h-screen">
      <aside className="sticky top-0 h-screen w-64 border-r bg-white">
        <div className="p-4 text-xl font-bold text-brand-600">Theobase</div>
        {churchName && (
          <div className="px-4 pb-4 text-sm text-neutral-500">{churchName}</div>
        )}
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            if (!hasMinRole(role, item.minRole)) return null;

            const isActive = currentPath === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                  className={cn(
                    'mx-2 flex items-center gap-3 rounded-md px-4 py-3 hover:bg-neutral-50',
                    isActive && 'border-l-2 border-brand-600 bg-brand-50 text-brand-700',
                  )}
                >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <h1 className="text-lg font-semibold">{churchName}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-500">{email}</span>
            <button
              onClick={logout}
              className="rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
