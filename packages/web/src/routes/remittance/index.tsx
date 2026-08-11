import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth-store';
import { RequireAuth } from '../../lib/auth-guard';
import { fetchRemittance, postChurchMutation } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export const Route = createFileRoute('/remittance/')({
  component: RemittancePage,
});

function RemittancePage() {
  const { churchId } = useAuth();
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [period, setPeriod] = useState(defaultPeriod);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
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
      } else {
        const err = await res.json().catch(() => ({}));
        setSubmitError((err as Record<string, unknown>).error as string ?? 'Failed to submit remittance.');
      }
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <RequireAuth allowedRoles={['treasurer']}>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-neutral-200" />
          ))}
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
              <h2 className="text-lg font-semibold text-neutral-900">Remittance Submitted</h2>
              <p className="mt-2 text-neutral-500">The remittance for {period} has been submitted to the Conference Treasurer.</p>
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
          <h1 className="text-2xl font-bold text-neutral-900">Tithe Remittance</h1>
          <input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        {report && (
          <>
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex justify-between"><span className="text-sm text-neutral-500">Total Tithe</span><span className="font-bold tabular-nums">${(report.titheTotal as number).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-neutral-500">Total Offerings</span><span className="font-bold tabular-nums">${(report.offeringTotal as number).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-neutral-500">Total Giving</span><span className="font-bold tabular-nums">${(report.totalGiving as number).toFixed(2)}</span></div>
                <div className="flex justify-between pt-3 border-t"><span className="text-sm font-medium">Amount to Remit (10%)</span><span className="text-xl font-bold tabular-nums text-brand-700">${(report.remitAmount as number).toFixed(2)}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Offering Categories</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(report.categories as Record<string, number> ?? {}).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between">
                      <span className="text-sm text-neutral-600 capitalize">{cat.replace(/-/g, ' ')}</span>
                      <span className="text-sm font-medium tabular-nums">${amt.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {submitError && (
              <div className="rounded-md bg-error-light px-4 py-3 text-sm text-error-700">{submitError}</div>
            )}
            <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting} isLoading={submitting}>
              {submitting ? 'Submitting...' : 'Approve and Submit Remittance'}
            </Button>
          </>
        )}
      </div>
    </div>
    </RequireAuth>
  );
}
