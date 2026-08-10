import { createRootRoute, Outlet } from '@tanstack/react-router';
import { SyncProvider } from '../lib/sync-provider';
import { StaleDataWarning } from '../components/features/stale-data-warning';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <SyncProvider churchId="default-church">
      <StaleDataWarning />
      <Outlet />
    </SyncProvider>
  );
}
