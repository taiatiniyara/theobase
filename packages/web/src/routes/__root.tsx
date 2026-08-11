import { createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queries';
import { SyncProvider } from '../lib/sync-provider';
import { AuthProvider, useAuth } from '../lib/auth-store';
import { RequireAuth } from '../lib/auth-guard';
import { StaleDataWarning } from '../components/features/stale-data-warning';
import { AppShell } from '../components/features/app-shell';
import { ErrorBoundary } from '../components/features/error-boundary';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { churchId } = useAuth();

  if (!churchId) {
    return (
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    );
  }

  return (
    <RequireAuth>
      <SyncProvider churchId={churchId}>
        <ErrorBoundary>
          <StaleDataWarning />
          <AppShell>
            <Outlet />
          </AppShell>
        </ErrorBoundary>
      </SyncProvider>
    </RequireAuth>
  );
}
