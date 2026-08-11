import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth-store';
import { RequireAuth } from '../../lib/auth-guard';
import { fetchRemittance, postChurchMutation } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { SkeletonCard } from '../../components/ui/skeleton';
import { Inbox, AlertTriangle, CheckCircle } from 'lucide-react';

export const Route = createFileRoute('/remittance/')({
  component: RemittancePage,
});

function RemittancePage() {
  const { churchId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [period, setPeriod] = useState(defaultPeriod);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['remittance', churchId, period],
    queryFn: () => fetchRemittance(churchId!, period),
    enabled: !!churchId,
  });

  const report = data as Record<string, unknown> | undefined;

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await postChurchMutation(churchId!, 'remittance:submit', {
        churchId,
        period,
        amount: report?.remitAmount,
        titheTotal: report?.titheTotal,
      });
      if (res.ok) {
        setSubmitted(true);
        toast('Remittance submitted successfully', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        const message = (err as Record<string, unknown>).error as string ?? 'Failed to submit remittance.';
        setSubmitError(message);
        toast(message, 'error');
      }
    } catch {
      setSubmitError('Network error. Please try again.');
      toast('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <RequireAuth allowedRoles={['treasurer']}>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-10 w-36 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
      </RequireAuth>
    );
  }

  if (isError) {
    return (
      <RequireAuth allowedRoles={['treasurer']}>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-warning" />
              <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Failed to Load</h2>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Could not load remittance data. Please try again.</p>
              <Button className="mt-6" variant="ghost" onClick={() => queryClient.invalidateQueries({ queryKey: ['remittance', churchId, period] })}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </RequireAuth>
    );
  }

  if (submitted) {
    return (
      <RequireAuth allowedRoles={['treasurer']}>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="mx-auto h-10 w-10 text-success" />
              <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Remittance Submitted</h2>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">The remittance for {period} has been submitted to the Conference Treasurer.</p>
              <Button className="mt-6" variant="ghost" onClick={() => setSubmitted(false)}>Submit Another</Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth allowedRoles={['treasurer']}>
    <div className="px-4 py-6">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Tithe Remittance</h1>
          <input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
          />
        </div>

        {report ? (
          <>
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex justify-between"><span className="text-sm text-neutral-500 dark:text-neutral-400">Total Tithe</span><span className="font-bold tabular-nums text-neutral-900 dark:text-neutral-100">${(report.titheTotal as number).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-neutral-500 dark:text-neutral-400">Total Offerings</span><span className="font-bold tabular-nums text-neutral-900 dark:text-neutral-100">${(report.offeringTotal as number).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-neutral-500 dark:text-neutral-400">Total Giving</span><span className="font-bold tabular-nums text-neutral-900 dark:text-neutral-100">${(report.totalGiving as number).toFixed(2)}</span></div>
                <div className="flex justify-between pt-3 border-t border-neutral-200 dark:border-neutral-700"><span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Amount to Remit (10%)</span><span className="text-xl font-bold tabular-nums text-brand-700 dark:text-brand-300">${(report.remitAmount as number).toFixed(2)}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Offering Categories</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(report.categories as Record<string, number> ?? {}).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400 capitalize">{cat.replace(/-/g, ' ')}</span>
                      <span className="text-sm font-medium tabular-nums text-neutral-900 dark:text-neutral-100">${amt.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {submitError && (
              <div className="rounded-md bg-error-light dark:bg-error-900/20 px-4 py-3 text-sm text-error-700 dark:text-error-400">{submitError}</div>
            )}
            <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting} isLoading={submitting}>
              {submitting ? 'Submitting...' : 'Approve and Submit Remittance'}
            </Button>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Inbox className="mx-auto h-10 w-10 text-neutral-400 dark:text-neutral-500" />
              <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">No Remittance Data</h2>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">No giving records found for {period}. Try selecting a different month.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </RequireAuth>
  );
}
