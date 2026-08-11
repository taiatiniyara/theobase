import { type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useAuth } from '../../lib/auth-store';
import { SyncIndicator } from './sync-indicator';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Users,
  Coins,
  DollarSign,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  minRole?: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { path: '/members', label: 'Members', icon: <Users className="h-5 w-5" />, minRole: 'clerk' },
  { path: '/counting-room', label: 'Counting Room', icon: <Coins className="h-5 w-5" />, minRole: 'counter' },
  { path: '/treasurer', label: 'Treasurer', icon: <DollarSign className="h-5 w-5" />, minRole: 'treasurer' },
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

  const initials = email ? email.slice(0, 2).toUpperCase() : '??';

  const desItems = NAV_ITEMS.filter((i) => roleCanSee(role, i.minRole));

  const givingTab = resolveGivingTab(role);
  const mobileItems = NAV_ITEMS.filter((item) => {
    if (!roleCanSee(role, item.minRole)) return false;
    if (item.path === '/counting-room' || item.path === '/treasurer') {
      return givingTab === item.path;
    }
    return true;
  });

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-neutral-200/60 bg-white md:flex md:flex-col">
        <div className="flex h-14 items-center gap-3 border-b border-neutral-200/60 px-5">
          <img src="/logo-full.svg" alt="Theobase" className="h-5 w-auto" />
        </div>
        {churchName && (
          <div className="px-5 pb-1 pt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              {churchName}
            </p>
          </div>
        )}
        <nav className="flex-1 space-y-0.5 px-3 py-3">
          {desItems.map((item) => {
            const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                )}
              >
                <span className={cn('transition-colors', isActive ? 'text-brand-600' : 'text-neutral-400')}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-neutral-200/60 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">{email}</p>
              <p className="text-xs text-neutral-500 capitalize">{role}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-neutral-200/60 bg-white/80 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 md:hidden">
            <img src="/logo-full.svg" alt="Theobase" className="h-5 w-auto" />
            <span className="text-sm font-semibold tracking-tight text-neutral-900">
              {churchName ?? 'Theobase'}
            </span>
          </div>
          <div className="hidden md:block">
            <span className="text-sm font-semibold text-neutral-700">{churchName}</span>
          </div>
          <div className="flex items-center gap-2">
            <SyncIndicator />
            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-200"
            >
              {initials}
            </button>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <nav className="z-10 flex h-16 shrink-0 items-center justify-around border-t border-neutral-200/60 bg-white/80 backdrop-blur-sm md:hidden">
          {mobileItems.map((item) => {
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path + '/'));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 px-3 py-2 text-[11px] font-medium transition-colors duration-150 min-w-[64px] min-h-[48px]',
                  isActive ? 'text-brand-600' : 'text-neutral-400',
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
