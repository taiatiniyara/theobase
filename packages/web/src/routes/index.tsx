import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/auth-store';
import { fetchInsights } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
  const { churchId, churchName, role } = useAuth();
  const navigate = useNavigate();
  const goTo = useCallback((to: string) => navigate({ to } as never), [navigate]);
  const { data } = useQuery({
    queryKey: ['insights', churchId],
    queryFn: () => fetchInsights(churchId!),
    enabled: !!churchId,
  });
  const insights = data?.insights ?? [];

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold text-neutral-900">{churchName ?? 'Dashboard'}</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button variant="secondary" className="w-full justify-start gap-2 h-12" onClick={() => goTo('/members')}>👥 Members</Button>
          <Button variant="secondary" className="w-full justify-start gap-2 h-12" onClick={() => goTo('/members/add')}>➕ Add Member</Button>
          {(role === 'treasurer' || role === 'clerk' || role === 'operator') && (
            <Button variant="secondary" className="w-full justify-start gap-2 h-12" onClick={() => goTo('/treasurer')}>💰 Treasurer</Button>
          )}
          {(role === 'counter' || role === 'operator') && (
            <Button variant="secondary" className="w-full justify-start gap-2 h-12" onClick={() => goTo('/counting-room')}>🔢 Counting</Button>
          )}
        </div>

        {insights.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-3">Insights</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {insights.map((insight, i) => (
                <Card key={i} className="min-w-[280px] flex-shrink-0">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{INSIGHT_ICONS[insight.type] ?? '📌'}</span>
                      <div>
                        <CardTitle className="text-base">{insight.title}</CardTitle>
                        <p className="text-sm text-neutral-500 mt-1">{insight.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" size="sm" className="text-brand-600" onClick={() => goTo(insight.action.to)}>
                      {insight.action.label} →
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {insights.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-lg font-semibold text-neutral-900">Welcome to Theobase</h2>
              <p className="mt-2 text-neutral-500">Start by adding members or recording giving.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
