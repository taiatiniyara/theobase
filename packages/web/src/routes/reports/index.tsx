import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth-store';
import { RequireAuth } from '../../lib/auth-guard';
import { fetchReport, postChurchMutation } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { SkeletonCard } from '../../components/ui/skeleton';
import { Inbox, AlertTriangle, CheckCircle } from 'lucide-react';

interface QuarterData {
  baptised: number;
  profession: number;
  transferIn: number;
  transferOut: number;
  deceased: number;
  removed: number;
}

interface ReportData {
  year: number;
  totalMembers: number;
  quarters: { q1: QuarterData; q2: QuarterData; q3: QuarterData; q4: QuarterData };
}

export const Route = createFileRoute('/reports/')({
  component: ReportsPage,
});

function ReportsPage() {
  const { churchId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['report', churchId, selectedYear],
    queryFn: () => fetchReport(churchId!, selectedYear),
    enabled: !!churchId,
  });

  const report = data as unknown as ReportData | undefined;

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await postChurchMutation(churchId!, 'report:submit', {
        churchId,
        year: selectedYear,
        data: report,
      });
      if (res.ok) {
        setSubmitted(true);
        toast('Annual report submitted for review', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        const message = (err as Record<string, unknown>).error as string ?? 'Failed to submit report.';
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
      <RequireAuth allowedRoles={['clerk', 'treasurer']}>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-64 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-10 w-24 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
      </RequireAuth>
    );
  }

  if (isError) {
    return (
      <RequireAuth allowedRoles={['clerk', 'treasurer']}>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-warning" />
              <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Failed to Load</h2>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Could not load statistical report data. Please try again.</p>
              <Button className="mt-6" variant="ghost" onClick={() => queryClient.invalidateQueries({ queryKey: ['report', churchId, selectedYear] })}>
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
      <RequireAuth allowedRoles={['clerk', 'treasurer']}>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="mx-auto h-10 w-10 text-success" />
              <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Report Submitted</h2>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">The {selectedYear} statistical report has been submitted to the Conference Secretary for review.</p>
              <Button className="mt-6" variant="ghost" onClick={() => setSubmitted(false)}>View Another Year</Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth allowedRoles={['clerk', 'treasurer']}>
    <div className="px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Annual Statistical Report</h1>
          <select
            className="rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {report ? (
          <>
            <Card>
              <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6">
                <div><div className="text-sm text-neutral-500 dark:text-neutral-400">Total Members</div><div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{report.totalMembers}</div></div>
                {(['q1','q2','q3','q4'] as const).map(q => (
                  <div key={q}>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">{q.toUpperCase()}</div>
                    <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{Object.values(report.quarters[q]).reduce((a, b) => a + b, 0)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {(['q1','q2','q3','q4'] as const).map(q => (
              <Card key={q}>
                <CardHeader><CardTitle>{q.toUpperCase()}</CardTitle></CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div><dt className="text-sm text-neutral-500 dark:text-neutral-400">Baptisms</dt><dd className="text-lg font-bold tabular-nums text-neutral-900 dark:text-neutral-100">{report.quarters[q].baptised}</dd></div>
                    <div><dt className="text-sm text-neutral-500 dark:text-neutral-400">Professions</dt><dd className="text-lg font-bold tabular-nums text-neutral-900 dark:text-neutral-100">{report.quarters[q].profession}</dd></div>
                    <div><dt className="text-sm text-neutral-500 dark:text-neutral-400">Transfers In</dt><dd className="text-lg font-bold tabular-nums text-success">{report.quarters[q].transferIn}</dd></div>
                    <div><dt className="text-sm text-neutral-500 dark:text-neutral-400">Transfers Out</dt><dd className="text-lg font-bold tabular-nums text-warning">{report.quarters[q].transferOut}</dd></div>
                    <div><dt className="text-sm text-neutral-500 dark:text-neutral-400">Deceased</dt><dd className="text-lg font-bold tabular-nums text-neutral-400 dark:text-neutral-500">{report.quarters[q].deceased}</dd></div>
                    <div><dt className="text-sm text-neutral-500 dark:text-neutral-400">Removed</dt><dd className="text-lg font-bold tabular-nums text-neutral-400 dark:text-neutral-500">{report.quarters[q].removed}</dd></div>
                  </dl>
                </CardContent>
              </Card>
            ))}

            {submitError && (
              <div className="rounded-md bg-error-light dark:bg-error-900/20 px-4 py-3 text-sm text-error-700 dark:text-error-400">{submitError}</div>
            )}
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">Review and Submit</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">All figures are auto-calculated from membership data. Submission is final.</p>
                </div>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Approve and Submit'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Inbox className="mx-auto h-10 w-10 text-neutral-400 dark:text-neutral-500" />
              <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">No Report Data</h2>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">No statistical data available for {selectedYear}. Try selecting a different year.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </RequireAuth>
  );
}
