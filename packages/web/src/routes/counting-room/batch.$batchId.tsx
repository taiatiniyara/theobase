import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-store';
import { RequireAuth } from '../../lib/auth-guard';
import { fetchBatchCompare, postChurchMutation } from '../../lib/api';
import { queryClient } from '../../lib/queries';
import { useToast } from '../../lib/toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Skeleton, SkeletonCard, SkeletonLine } from '../../components/ui/skeleton';

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
  const { toast } = useToast();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: () => fetchBatchCompare(churchId!, batchId),
    enabled: !!churchId,
    refetchInterval: 5000,
  });

  const isCounter2 = role === 'counter';

  async function handleCounter2Confirm() {
    setSubmitting(true);
    try {
      const records = data?.counter2?.records ?? [];
      await postChurchMutation(churchId!, 'giving_batch:counter2-confirm', {
        batchId,
        counter2Id: 'current-user',
        records,
        timestamp: Date.now(),
      });
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      toast('Counter 2 confirmed!', 'success');
    } catch {
      toast('Failed to confirm. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReconcile() {
    setSubmitting(true);
    try {
      const records = Object.entries(newAmounts).map(([memberId, amt]) => ({
        memberId,
        amount: parseFloat(amt) || 0,
      }));
      await postChurchMutation(churchId!, 'giving_batch:reconcile', {
        batchId,
        records,
        timestamp: Date.now(),
      });
      setReconcileMode(false);
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      toast('Batch reconciled!', 'success');
    } catch {
      toast('Reconciliation failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCommit() {
    setSubmitting(true);
    try {
      const allRecords = data?.counter1?.records ?? [];
      await postChurchMutation(churchId!, 'giving_batch:commit', {
        batchId,
        records: allRecords,
        timestamp: Date.now(),
      });
      toast('Batch committed!', 'success');
      navigate({ to: '/counting-room' });
    } catch {
      toast('Commit failed. Please try again.', 'error');
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <RequireAuth allowedRoles={['counter']}>
      <div className="min-h-screen bg-neutral-50 px-4 py-6 dark:bg-neutral-950">
        <div className="mx-auto max-w-lg space-y-6">
          <div className="flex items-center justify-between">
            <SkeletonLine width="w-40" />
            <SkeletonLine width="w-32" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-0.5 flex-1" />
            <Skeleton className="h-3 w-3 rounded-full" />
          </div>
          <SkeletonCard />
          <SkeletonCard />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      </RequireAuth>
    );
  }

  if (isError || !data) {
    return (
      <RequireAuth allowedRoles={['counter']}>
      <div className="min-h-screen bg-neutral-50 px-4 py-6 dark:bg-neutral-950">
        <div className="mx-auto max-w-lg space-y-6">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Batch Details</h1>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-neutral-600 dark:text-neutral-400">Failed to load batch.</p>
              <Button variant="secondary" className="mt-4" onClick={() => refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
          <Button variant="ghost" className="w-full" onClick={() => navigate({ to: '/counting-room' })}>
            Back to Counting Room
          </Button>
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
    <div className="min-h-screen bg-neutral-50 px-4 py-6 dark:bg-neutral-950">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Batch Details</h1>
          {statusBadge(data.status)}
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${data.status !== 'counter1-confirmed' ? 'text-success dark:text-green-400' : 'text-brand-600 dark:text-brand-400'}`}>
            <div className={`h-3 w-3 rounded-full ${data.status !== 'counter1-confirmed' ? 'bg-success' : 'bg-brand-600'}`} />
            <span className="text-sm font-medium">Counter 1</span>
          </div>
          <div className="flex-1 h-0.5 bg-neutral-200 dark:bg-neutral-700" />
          <div className={`flex items-center gap-2 ${data.status === 'committed' || data.status === 'reconciled' ? 'text-success dark:text-green-400' : data.status === 'counter2-confirmed' ? 'text-warning dark:text-amber-400' : 'text-neutral-400 dark:text-neutral-500'}`}>
            <div className={`h-3 w-3 rounded-full ${data.status === 'committed' || data.status === 'reconciled' ? 'bg-success' : data.status === 'counter2-confirmed' ? 'bg-warning' : 'bg-neutral-300 dark:bg-neutral-600'}`} />
            <span className="text-sm font-medium">Counter 2</span>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Totals</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Counter 1 Total</span>
              <span className="text-lg font-bold tabular-nums text-neutral-900 dark:text-neutral-100">${data.counter1.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Counter 2 Total</span>
              <span className="text-lg font-bold tabular-nums text-neutral-900 dark:text-neutral-100">${data.counter2.total.toFixed(2)}</span>
            </div>
            {data.counter2.total > 0 && (
              <div className="flex justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Difference</span>
                <span className={`text-lg font-bold tabular-nums ${data.totalsMatch ? 'text-success dark:text-green-400' : 'text-error dark:text-red-400'}`}>
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
                    <div key={i} className={`flex items-center justify-between rounded-md px-3 py-2 ${match ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      <span className="text-sm text-neutral-900 dark:text-neutral-100">{(r as Record<string,unknown>).memberName as string ?? `Record ${i+1}`}</span>
                      <div className="flex items-center gap-2 text-sm tabular-nums">
                        <span className={match ? 'text-neutral-600 dark:text-neutral-400' : 'text-error dark:text-red-400 font-medium'}>
                          ${(r.amount as number).toFixed(2)}
                        </span>
                        {c2r && (
                          <>
                            <span className="text-neutral-300 dark:text-neutral-600">vs</span>
                            <span className={match ? 'text-neutral-600 dark:text-neutral-400' : 'text-error dark:text-red-400 font-medium'}>
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
            <p className="text-center text-success dark:text-green-400 font-medium">This batch has been committed.</p>
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
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Adjust amounts to resolve differences:</p>
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
