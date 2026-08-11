import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/auth-store';
import { fetchInsights } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

const INSIGHT_ICONS: Record<string, string> = {
  'giving-decline': '📉',
  'inactive-members': '👤',
  'report-ready': '📋',
  'tithe-overdue': '⏰',
};

function DashboardPage() {
  const { churchId, role } = useAuth();
  const navigate = useNavigate();
  const goTo = useCallback((to: string) => navigate({ to } as never), [navigate]);
  const { data } = useQuery({
    queryKey: ['insights', churchId],
    queryFn: () => fetchInsights(churchId!),
    enabled: !!churchId,
  });
  const insights = data?.insights ?? [];

  return (
    <div className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
      <section>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {insights.map((insight, i) => (
            <Card key={i} className="min-w-[260px] flex-shrink-0 bg-brand-100 border-brand-200 dark:bg-brand-900 dark:border-brand-800">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{INSIGHT_ICONS[insight.type] ?? '📌'}</span>
                  <div>
                    <div className="text-sm font-semibold text-brand-700 dark:text-brand-300">{insight.title}</div>
                    <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">{insight.description}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-brand-600 h-auto py-1" onClick={() => goTo(insight.action.to)}>
                  {insight.action.label} →
                </Button>
              </CardContent>
            </Card>
          ))}
          {insights.length === 0 && (
            <Card className="min-w-[260px] flex-shrink-0">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-neutral-500">No insights yet — they will appear as data flows in.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={() => goTo('/members')}>👥 Members</Button>
          <Button variant="secondary" size="sm" onClick={() => goTo('/members/add')}>➕ Add Member</Button>
          {(role === 'treasurer' || role === 'clerk' || role === 'operator') && (
            <Button variant="secondary" size="sm" onClick={() => goTo('/treasurer')}>💰 Treasurer</Button>
          )}
          {(role === 'counter' || role === 'operator') && (
            <Button variant="secondary" size="sm" onClick={() => goTo('/counting-room')}>🔢 Counting</Button>
          )}
          {(role === 'clerk' || role === 'operator') && (
            <Button variant="secondary" size="sm" onClick={() => goTo('/reports')}>📋 Reports</Button>
          )}
        </div>
      </section>

      <section>
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Welcome to Theobase</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Your church management platform. The system does the work — you review and approve.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
