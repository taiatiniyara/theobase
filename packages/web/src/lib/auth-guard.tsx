import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from './auth-store';

interface RequireAuthProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const PUBLIC_PATHS = ['/login', '/church/register', '/visitor'];

export function useAuthGuard(allowedRoles?: string[]): boolean {
  const { churchId, role, isSuperAdmin } = useAuth();
  const { location } = useRouterState();
  const navigate = useNavigate();
  const path = location.pathname;

  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'));

  useEffect(() => {
    if (!churchId && !isSuperAdmin && !isPublic) {
      navigate({ to: '/login', search: { redirect: path } });
    }
  }, [churchId, isSuperAdmin, isPublic, path, navigate]);

  if (!churchId && !isSuperAdmin && !isPublic) return false;

  if (allowedRoles && allowedRoles.length > 0 && role && !allowedRoles.includes(role) && role !== 'operator') {
    return false;
  }

  return true;
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const { churchId, role, isSuperAdmin } = useAuth();
  const { location } = useRouterState();
  const navigate = useNavigate();
  const path = location.pathname;

  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'));

  useEffect(() => {
    if (!churchId && !isSuperAdmin && !isPublic) {
      navigate({ to: '/login', search: { redirect: path } });
    }
  }, [churchId, isSuperAdmin, isPublic, path, navigate]);

  if (!churchId && !isSuperAdmin && !isPublic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-neutral-500">Redirecting to login...</p>
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && role && !allowedRoles.includes(role) && role !== 'operator') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold text-neutral-900">Access Denied</h1>
          <p className="text-neutral-500">You don't have permission to access this page.</p>
          <button
            type="button"
            onClick={() => navigate({ to: '/' })}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
