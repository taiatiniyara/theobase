import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-store';
import { RequireAuth } from '../../lib/auth-guard';
import { fetchBatchCompare, postChurchMutation } from '../../lib/api';
import { queryClient } from '../../lib/queries';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';

export const Route = createFileRoute('/counting-room/batch/$batchId')({
  component: BatchDetailPage,
});

function BatchDetailPage() {
  const { batchId } = Route.useParams();
  const { churchId, role } = useAuth();
  const navigate = useNavigate();
  const [reconcileMode, setReconcileMode] = useState(false);
  const [newAmounts, setNewAmounts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: () => fetchBatchCompare(churchId!, batchId),
    enabled: !!churchId,
    refetchInterval: 5000,
  });

  const isCounter2 = role === 'counter';

  async function handleCounter2Confirm() {
    setSubmitting(true);
    const records = data?.counter2?.records ?? [];
    await postChurchMutation(churchId!, 'giving_batch:counter2-confirm', {
      batchId,
      counter2Id: 'current-user',
      records,
      timestamp: Date.now(),
    });
    queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
    setSubmitting(false);
  }

  async function handleReconcile() {
    setSubmitting(true);
    const records = Object.entries(newAmounts).map(([memberId, amt]) => ({
      memberId,
      amount: parseFloat(amt) || 0,
    }));
    await postChurchMutation(churchId!, 'giving_batch:reconcile', {
      batchId,
      records,
      timestamp: Date.now(),
    });
    setSubmitting(false);
    setReconcileMode(false);
    queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
  }

  async function handleCommit() {
    setSubmitting(true);
    const allRecords = data?.counter1?.records ?? [];
    await postChurchMutation(churchId!, 'giving_batch:commit', {
      batchId,
      records: allRecords,
      timestamp: Date.now(),
    });
    setSubmitting(false);
    navigate({ to: '/counting-room' });
  }

  if (isLoading) {
    return (
      <RequireAuth allowedRoles={['counter']}>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-neutral-200 mb-4" />
          ))}
        </div>
      </div>
      </RequireAuth>
    );
  }

  if (!data) {
    return (
      <RequireAuth allowedRoles={['counter']}>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg text-center py-24">
          <p className="text-neutral-600">Batch not found.</p>
        </div>
      </div>
      </RequireAuth>
    );
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'counter1-confirmed': return <Badge variant="warning">Waiting for Counter 2</Badge>;
      case 'counter2-confirmed': return data.totalsMatch ? <Badge variant="success">Ready to Commit</Badge> : <Badge variant="error">Disputed</Badge>;
      case 'committed': return <Badge variant="success">Committed</Badge>;
      case 'reconciled': return <Badge variant="success">Reconciled — Ready to Commit</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <RequireAuth allowedRoles={['counter']}>
    <div className="px-4 py-6">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-900">Batch Details</h1>
          {statusBadge(data.status)}
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${data.status !== 'counter1-confirmed' ? 'text-success' : 'text-brand-600'}`}>
            <div className={`h-3 w-3 rounded-full ${data.status !== 'counter1-confirmed' ? 'bg-success' : 'bg-brand-600'}`} />
            <span className="text-sm font-medium">Counter 1</span>
          </div>
          <div className="flex-1 h-0.5 bg-neutral-200" />
          <div className={`flex items-center gap-2 ${data.status === 'committed' || data.status === 'reconciled' ? 'text-success' : data.status === 'counter2-confirmed' ? 'text-warning' : 'text-neutral-400'}`}>
            <div className={`h-3 w-3 rounded-full ${data.status === 'committed' || data.status === 'reconciled' ? 'bg-success' : data.status === 'counter2-confirmed' ? 'bg-warning' : 'bg-neutral-300'}`} />
            <span className="text-sm font-medium">Counter 2</span>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Totals</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500">Counter 1 Total</span>
              <span className="text-lg font-bold tabular-nums">${data.counter1.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500">Counter 2 Total</span>
              <span className="text-lg font-bold tabular-nums">${data.counter2.total.toFixed(2)}</span>
            </div>
            {data.counter2.total > 0 && (
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm font-medium">Difference</span>
                <span className={`text-lg font-bold tabular-nums ${data.totalsMatch ? 'text-success' : 'text-error'}`}>
                  ${Math.abs(data.counter1.total - data.counter2.total).toFixed(2)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {data.counter2.records.length > 0 && !data.totalsMatch && (
          <Card>
            <CardHeader><CardTitle>Side-by-Side Comparison</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.counter1.records.map((r, i) => {
                  const c2r = data.counter2.records[i];
                  const match = c2r && r.amount === c2r.amount;
                  return (
                    <div key={i} className={`flex items-center justify-between rounded-md px-3 py-2 ${match ? 'bg-green-50' : 'bg-red-50'}`}>
                      <span className="text-sm">{((r as Record<string,unknown>).memberName as string) ?? `Record ${i+1}`}</span>
                      <div className="flex items-center gap-2 text-sm tabular-nums">
                        <span className={match ? 'text-neutral-600' : 'text-error font-medium'}>
                          ${(r.amount as number).toFixed(2)}
                        </span>
                        {c2r && (
                          <>
                            <span className="text-neutral-300">vs</span>
                            <span className={match ? 'text-neutral-600' : 'text-error font-medium'}>
                              ${(c2r.amount as number).toFixed(2)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {data.status === 'committed' && (
            <p className="text-center text-success font-medium">This batch has been committed.</p>
          )}

          {data.status === 'counter1-confirmed' && isCounter2 && (
            <Button className="w-full" onClick={handleCounter2Confirm} disabled={submitting}>
              {submitting ? 'Confirming...' : 'Confirm Counter 2 Count'}
            </Button>
          )}

          {(data.status === 'counter2-confirmed' || data.status === 'reconciled') && (
            <Button className="w-full" onClick={handleCommit} disabled={submitting}>
              {submitting ? 'Committing...' : `Commit Batch — $${data.counter1.total.toFixed(2)}`}
            </Button>
          )}

          {(data.status === 'counter2-confirmed' && !data.totalsMatch) && (
            <>
              {!reconcileMode ? (
                <Button variant="secondary" className="w-full" onClick={() => setReconcileMode(true)}>
                  Reconcile Differences
                </Button>
              ) : (
                <Card>
                  <CardContent className="space-y-4 p-4">
                    <p className="text-sm text-neutral-600">Adjust amounts to resolve differences:</p>
                    {data.counter1.records.map((r, i) => (
                      <Input
                        key={i}
                        type="number"
                        step="0.01"
                        value={newAmounts[i] ?? String(r.amount)}
                        onChange={e => setNewAmounts(prev => ({ ...prev, [i]: e.target.value }))}
                      />
                    ))}
                    <div className="flex gap-3">
                      <Button variant="ghost" onClick={() => setReconcileMode(false)}>Cancel</Button>
                      <Button onClick={handleReconcile} disabled={submitting}>
                        {submitting ? 'Reconciling...' : 'Confirm Reconciliation'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <Button variant="ghost" className="w-full" onClick={() => navigate({ to: '/counting-room' })}>
            Back to Counting Room
          </Button>
        </div>
      </div>
    </div>
    </RequireAuth>
  );
}
