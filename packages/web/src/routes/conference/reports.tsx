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

export const Route = createFileRoute('/conference/reports')({
  component: ConferenceReportsPage,
});

function ConferenceReportsPage() {
  const { churchId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [returningId, setReturningId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const { data: state, isLoading, isError } = useQuery({
    queryKey: ['church-state', churchId],
    queryFn: () => fetchChurchState(churchId!),
    enabled: !!churchId,
  });

  const reports = (state?.reports as Array<Record<string, unknown>>) ?? [];

  async function handleApprove(reportId: string) {
    setSubmitting(`approve-${reportId}`);
    try {
      await postChurchMutation(churchId!, 'report:approve', { reportId });
      queryClient.invalidateQueries({ queryKey: ['church-state', churchId] });
      toast('Report approved', 'success');
    } catch {
      toast('Failed to approve report', 'error');
    } finally {
      setSubmitting(null);
    }
  }

  async function handleReturn(reportId: string) {
    setSubmitting(`return-${reportId}`);
    try {
      await postChurchMutation(churchId!, 'report:return', { reportId, reason });
      queryClient.invalidateQueries({ queryKey: ['church-state', churchId] });
      setReturningId(null);
      setReason('');
      toast('Report returned for revision', 'success');
    } catch {
      toast('Failed to return report', 'error');
    } finally {
      setSubmitting(null);
    }
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

  if (isError) {
    return (
      <RequireAuth allowedRoles={['conference-secretary', 'conference-president']}>
        <div className="px-4 py-6">
          <div className="mx-auto max-w-3xl text-center py-24">
            <h2 className="text-xl font-semibold text-neutral-900">Failed to load reports</h2>
            <p className="mt-2 text-neutral-500">Something went wrong while fetching conference data.</p>
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
      <RequireAuth allowedRoles={['conference-secretary', 'conference-president']}>
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
    <RequireAuth allowedRoles={['conference-secretary', 'conference-president']}>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-2xl font-bold text-neutral-900">Conference Reports</h1>

          {reports.length === 0 ? (
            <p className="py-12 text-center text-neutral-500">No reports submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {reports.map((r: Record<string, unknown>) => {
                const rid = r.id as string;
                return (
                  <Card key={rid}>
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
                        <p className="mb-3 text-sm text-red-600">Reason: {r.returnReason as string}</p>
                      )}
                      {r.status === 'submitted' && (
                        <div className="flex gap-3">
                          <Button onClick={() => handleApprove(rid)} isLoading={submitting === `approve-${rid}`}>
                            {submitting === `approve-${rid}` ? 'Approving...' : 'Approve'}
                          </Button>
                          {returningId === rid ? (
                            <div className="flex flex-1 gap-2">
                              <label className="flex-1">
                                <span className="sr-only">Reason for return</span>
                                <input
                                  className="h-12 w-full rounded-md border border-neutral-300 px-3 text-sm"
                                  placeholder="Reason for return..."
                                  value={reason}
                                  onChange={e => setReason(e.target.value)}
                                />
                              </label>
                              <Button variant="secondary" onClick={() => handleReturn(rid)} isLoading={submitting === `return-${rid}`}>
                                {submitting === `return-${rid}` ? 'Returning...' : 'Return'}
                              </Button>
                              <Button variant="ghost" onClick={() => setReturningId(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" onClick={() => setReturningId(rid)}>
                              Return for Revision
                            </Button>
                          )}
                        </div>
                      )}
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
