import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth-store';
import { RequireAuth } from '../../lib/auth-guard';
import { fetchReport, postChurchMutation } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

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
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading } = useQuery({
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
      } else {
        const err = await res.json().catch(() => ({}));
        setSubmitError((err as Record<string, unknown>).error as string ?? 'Failed to submit report.');
      }
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <RequireAuth allowedRoles={['clerk', 'treasurer']}>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-neutral-200" />
          ))}
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
              <h2 className="text-lg font-semibold text-neutral-900">Report Submitted</h2>
              <p className="mt-2 text-neutral-500">The {selectedYear} statistical report has been submitted to the Conference Secretary for review.</p>
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
          <h1 className="text-2xl font-bold text-neutral-900">Annual Statistical Report</h1>
          <select
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {report && (
          <>
            <Card>
              <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6">
                <div><div className="text-sm text-neutral-500">Total Members</div><div className="text-2xl font-bold">{report.totalMembers}</div></div>
                {(['q1','q2','q3','q4'] as const).map(q => (
                  <div key={q}>
                    <div className="text-sm text-neutral-500">{q.toUpperCase()}</div>
                    <div className="text-2xl font-bold">{Object.values(report.quarters[q]).reduce((a, b) => a + b, 0)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {(['q1','q2','q3','q4'] as const).map(q => (
              <Card key={q}>
                <CardHeader><CardTitle>{q.toUpperCase()}</CardTitle></CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div><dt className="text-sm text-neutral-500">Baptisms</dt><dd className="text-lg font-bold tabular-nums">{report.quarters[q].baptised}</dd></div>
                    <div><dt className="text-sm text-neutral-500">Professions</dt><dd className="text-lg font-bold tabular-nums">{report.quarters[q].profession}</dd></div>
                    <div><dt className="text-sm text-neutral-500">Transfers In</dt><dd className="text-lg font-bold tabular-nums text-success">{report.quarters[q].transferIn}</dd></div>
                    <div><dt className="text-sm text-neutral-500">Transfers Out</dt><dd className="text-lg font-bold tabular-nums text-warning">{report.quarters[q].transferOut}</dd></div>
                    <div><dt className="text-sm text-neutral-500">Deceased</dt><dd className="text-lg font-bold tabular-nums text-neutral-400">{report.quarters[q].deceased}</dd></div>
                    <div><dt className="text-sm text-neutral-500">Removed</dt><dd className="text-lg font-bold tabular-nums text-neutral-400">{report.quarters[q].removed}</dd></div>
                  </dl>
                </CardContent>
              </Card>
            ))}

            {submitError && (
              <div className="rounded-md bg-error-light px-4 py-3 text-sm text-error-700 mb-4">{submitError}</div>
            )}
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900">Review and Submit</p>
                  <p className="text-sm text-neutral-500">All figures are auto-calculated from membership data. Submission is final.</p>
                </div>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Approve and Submit'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </RequireAuth>
  );
}
