import { createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queries';
import { SyncProvider } from '../lib/sync-provider';
import { AuthProvider, useAuth } from '../lib/auth-store';
import { StaleDataWarning } from '../components/features/stale-data-warning';
import { AppShell } from '../components/features/app-shell';

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
      <>
        <StaleDataWarning />
        <Outlet />
      </>
    );
  }

  return (
    <SyncProvider churchId={churchId}>
      <StaleDataWarning />
      <AppShell>
        <Outlet />
      </AppShell>
    </SyncProvider>
  );
}
