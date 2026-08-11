import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth-store';
import { RequireAuth } from '../../lib/auth-guard';
import { fetchChurchState, postChurchMutation } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export const Route = createFileRoute('/conference/remittances')({
  component: ConferenceRemittancesPage,
});

function ConferenceRemittancesPage() {
  const { churchId } = useAuth();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const { data: state, isLoading } = useQuery({
    queryKey: ['church-state', churchId],
    queryFn: () => fetchChurchState(churchId!),
    enabled: !!churchId,
    refetchInterval: 10000,
  });

  const remittances = (state?.remittances as Array<Record<string, unknown>>) ?? [];

  async function handleReceive(remittanceId: string) {
    setSubmitting(remittanceId);
    await postChurchMutation(churchId!, 'remittance:receive', { remittanceId });
    queryClient.invalidateQueries({ queryKey: ['church-state', churchId] });
    setSubmitting(null);
  }

  if (isLoading) {
    return (
      <RequireAuth allowedRoles={['conference-treasurer', 'conference-president']}>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
          ))}
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
          <p className="text-center text-neutral-500 py-12">No remittances submitted yet.</p>
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
                      <p className="text-sm text-neutral-500">Church: {r.churchId as string}</p>
                    </div>
                    <Badge variant={r.status === 'received' ? 'success' : 'warning'}>{r.status as string}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold tabular-nums">${(r.amount as number).toFixed(2)}</span>
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
