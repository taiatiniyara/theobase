import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchChurchState, postChurchMutation } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export const Route = createFileRoute('/conference/remittances')({
  component: ConferenceRemittancesPage,
});

function ConferenceRemittancesPage() {
  const queryClient = useQueryClient();
  const { data: state } = useQuery({
    queryKey: ['church-state', 'default-church'],
    queryFn: () => fetchChurchState('default-church'),
    refetchInterval: 10000,
  });

  const remittances = (state?.remittances as Array<Record<string, unknown>>) ?? [];

  async function handleReceive(remittanceId: string) {
    await postChurchMutation('default-church', 'remittance:receive', { remittanceId });
    queryClient.invalidateQueries({ queryKey: ['church-state', 'default-church'] });
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-neutral-900">Tithe Remittances</h1>
        {remittances.length === 0 ? (
          <p className="text-center text-neutral-500 py-12">No remittances submitted yet.</p>
        ) : (
          <div className="space-y-4">
            {remittances.map((r: Record<string, unknown>) => (
              <Card key={r.id as string}>
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
                      <Button onClick={() => handleReceive(r.id as string)}>Mark Received</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
