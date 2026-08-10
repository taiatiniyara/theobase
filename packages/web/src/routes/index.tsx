import { createFileRoute, Link } from '@tanstack/react-router';
import { APP_NAME } from '@theobase/shared';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-md space-y-8 text-center">
        <img src="/logo-icon.svg" alt={APP_NAME} className="mx-auto h-20 w-20" />

        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{APP_NAME}</h1>

        <p className="text-base text-neutral-600 dark:text-neutral-400">
          Church membership and giving platform for the Fiji Mission
        </p>

        <div className="flex items-center justify-center gap-3">
          <Badge variant="success">v0.0.1</Badge>
          <Badge variant="default">Offline-first</Badge>
          <Badge variant="warning">PWA</Badge>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-brand-100 dark:bg-brand-800 border-brand-200 dark:border-brand-700">
            <div className="text-2xl font-bold tabular-nums text-brand-700 dark:text-brand-300">
              $2,450
            </div>
            <div className="mt-1 text-xs text-brand-600 dark:text-brand-400">This Week</div>
          </Card>
          <Card className="bg-brand-100 dark:bg-brand-800 border-brand-200 dark:border-brand-700">
            <div className="text-2xl font-bold tabular-nums text-brand-700 dark:text-brand-300">
              142
            </div>
            <div className="mt-1 text-xs text-brand-600 dark:text-brand-400">Members</div>
          </Card>
          <Card className="bg-brand-100 dark:bg-brand-800 border-brand-200 dark:border-brand-700">
            <div className="text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-300">
              3
            </div>
            <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">Pending</div>
          </Card>
        </div>

        <Button asChild>
          <Link to="/">Get Started</Link>
        </Button>
      </div>
    </div>
  );
}
