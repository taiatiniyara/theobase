import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchChurchState, postChurchMutation } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export const Route = createFileRoute('/conference/reports')({
  component: ConferenceReportsPage,
});

function ConferenceReportsPage() {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [returningId, setReturningId] = useState<string | null>(null);

  const { data: state } = useQuery({
    queryKey: ['church-state', 'default-church'],
    queryFn: () => fetchChurchState('default-church'),
  });

  const reports = (state?.reports as Array<Record<string, unknown>>) ?? [];

  async function handleApprove(reportId: string) {
    await postChurchMutation('default-church', 'report:approve', { reportId });
    queryClient.invalidateQueries({ queryKey: ['church-state', 'default-church'] });
  }

  async function handleReturn(reportId: string) {
    await postChurchMutation('default-church', 'report:return', { reportId, reason });
    queryClient.invalidateQueries({ queryKey: ['church-state', 'default-church'] });
    setReturningId(null);
    setReason('');
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'warning' as const;
      case 'approved':
        return 'success' as const;
      case 'returned':
        return 'error' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-neutral-900">Conference Reports</h1>

        {reports.length === 0 ? (
          <p className="text-center text-neutral-500 py-12">No reports submitted yet.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((r: Record<string, unknown>) => (
              <Card key={r.id as string}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{(r.data as Record<string, unknown>)?.year as number} Report</CardTitle>
                      <p className="text-sm text-neutral-500">
                        Church: {r.churchId as string} ·{' '}
                        {r.submittedAt ? new Date(r.submittedAt as number).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <Badge variant={statusVariant(r.status as string)}>{r.status as string}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {r.status === 'returned' && (
                    <p className="text-sm text-red-600 mb-3">Reason: {r.returnReason as string}</p>
                  )}
                  {r.status === 'submitted' && (
                    <div className="flex gap-3">
                      <Button onClick={() => handleApprove(r.id as string)}>Approve</Button>
                      {returningId === r.id ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            className="flex-1 rounded-md border border-neutral-300 px-3 py-1 text-sm"
                            placeholder="Reason for return..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                          />
                          <Button variant="secondary" onClick={() => handleReturn(r.id as string)}>
                            Return
                          </Button>
                          <Button variant="ghost" onClick={() => setReturningId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" onClick={() => setReturningId(r.id as string)}>
                          Return for Revision
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
