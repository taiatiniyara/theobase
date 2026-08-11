import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth-store';
import { RequireAuth } from '../../lib/auth-guard';
import { fetchChurchState, postChurchMutation } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { SkeletonCard } from '../../components/ui/skeleton';
import { useToast } from '../../lib/toast';

export const Route = createFileRoute('/conference/remittances')({
  component: ConferenceRemittancesPage,
});

function ConferenceRemittancesPage() {
  const { churchId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const { data: state, isLoading, isError } = useQuery({
    queryKey: ['church-state', churchId],
    queryFn: () => fetchChurchState(churchId!),
    enabled: !!churchId,
    refetchInterval: 10000,
  });

  const remittances = (state?.remittances as Array<Record<string, unknown>>) ?? [];

  async function handleReceive(remittanceId: string) {
    setSubmitting(remittanceId);
    try {
      await postChurchMutation(churchId!, 'remittance:receive', { remittanceId });
      queryClient.invalidateQueries({ queryKey: ['church-state', churchId] });
      toast('Remittance marked as received', 'success');
    } catch {
      toast('Failed to mark remittance as received', 'error');
    } finally {
      setSubmitting(null);
    }
  }

  if (isError) {
    return (
      <RequireAuth allowedRoles={['conference-treasurer', 'conference-president']}>
        <div className="px-4 py-6">
          <div className="mx-auto max-w-3xl text-center py-24">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Failed to load remittances</h2>
            <p className="mt-2 text-neutral-500 dark:text-neutral-400">Something went wrong while fetching remittance data.</p>
            <Button
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['church-state', churchId] })}
            >
              Retry
            </Button>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (isLoading) {
    return (
      <RequireAuth allowedRoles={['conference-treasurer', 'conference-president']}>
        <div className="px-4 py-6">
          <div className="mx-auto max-w-3xl space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth allowedRoles={['conference-treasurer', 'conference-president']}>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Tithe Remittances</h1>
          {remittances.length === 0 ? (
            <p className="py-12 text-center text-neutral-500 dark:text-neutral-400">No remittances submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {remittances.map((r: Record<string, unknown>) => {
                const rimId = r.id as string;
                return (
                  <Card key={rimId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{r.period as string}</CardTitle>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Church: {r.churchId as string}</p>
                        </div>
                        <Badge variant={r.status === 'received' ? 'success' : 'warning'}>{r.status as string}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">${(r.amount as number).toFixed(2)}</span>
                        {r.status !== 'received' && (
                          <Button onClick={() => handleReceive(rimId)} isLoading={submitting === rimId}>
                            {submitting === rimId ? 'Marking...' : 'Mark Received'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
