import { type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useAuth } from '../../lib/auth-store';
import { cn } from '../../lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  minRole?: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Home', icon: '⌂' },
  { path: '/members', label: 'Members', icon: '👥', minRole: 'clerk' },
  { path: '/counting-room', label: 'Giving', icon: '🔢', minRole: 'counter' },
  { path: '/treasurer', label: 'Giving', icon: '💰', minRole: 'treasurer' },
];

const ROLE_ORDER: Record<string, number> = { clerk: 1, treasurer: 1, counter: 1, operator: 99 };

function roleCanSee(userRole: string | null, minRole: string | undefined): boolean {
  if (!minRole) return true;
  if (!userRole) return false;
  if (userRole === 'operator') return true;
  return (ROLE_ORDER[userRole] ?? 0) >= (ROLE_ORDER[minRole] ?? 0);
}

function resolveGivingTab(role: string | null): string | null {
  if (!role || role === 'clerk') return null;
  if (role === 'treasurer' || role === 'operator') return '/treasurer';
  if (role === 'counter') return '/counting-room';
  return null;
}

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { churchName, role, email, logout } = useAuth();
  const { location } = useRouterState();
  const currentPath = location.pathname;

  const initials = email
    ? email.slice(0, 2).toUpperCase()
    : '??';

  const bottomItems = NAV_ITEMS.filter((item) => {
    if (!roleCanSee(role, item.minRole)) return false;

    const givingTab = resolveGivingTab(role);
    if (item.path === '/counting-room' && givingTab !== '/counting-room') return false;
    if (item.path === '/treasurer' && givingTab !== '/treasurer') return false;

    if (item.path === '/counting-room' || item.path === '/treasurer') {
      return givingTab === item.path;
    }

    return true;
  });

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-neutral-200 bg-white md:block dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex h-14 items-center gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800">
          <img src="/branding/logo-icon.svg" alt="Theobase" className="h-8 w-8" />
          <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Theobase</span>
        </div>
        {churchName && (
          <div className="px-4 pb-2 pt-3 text-sm text-neutral-500">{churchName}</div>
        )}
        <nav className="mt-2 flex flex-col gap-1 px-2">
          {NAV_ITEMS.filter((i) => roleCanSee(role, i.minRole)).map((item) => {
            const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'border-l-2 border-brand-600 bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
                )}
              >
                <span aria-hidden="true" className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center gap-3 md:hidden">
            <img src="/branding/logo-icon.svg" alt="Theobase" className="h-7 w-7" />
            <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Theobase</span>
          </div>
          <div className="hidden md:block">
            <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{churchName}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-neutral-500 sm:inline">{email}</span>
            <button
              type="button"
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-700 dark:bg-brand-900 dark:text-brand-300"
            >
              {initials}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>

        <nav className="z-10 flex h-16 shrink-0 items-center justify-around border-t border-neutral-200 bg-white md:hidden dark:border-neutral-800 dark:bg-neutral-900">
          {bottomItems.map((item) => {
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path + '/'));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2 py-2 text-xs font-medium transition-colors duration-150 min-w-[64px] min-h-[48px] justify-center',
                  isActive
                    ? 'text-brand-600'
                    : 'text-neutral-500',
                )}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
