import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/auth-store';
import { fetchInsights } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  TrendingDown,
  UserMinus,
  FileText,
  Clock,
  UserPlus,
  Users,
  ArrowUpRight,
  FileDown,
  PiggyBank,
  Home,
} from 'lucide-react';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

const INSIGHT_ICONS: Record<string, typeof TrendingDown> = {
  'giving-decline': TrendingDown,
  'inactive-members': UserMinus,
  'report-ready': FileText,
  'tithe-overdue': Clock,
};

const QUICK_ACTIONS = [
  { label: 'Add Member', to: '/members/add', icon: UserPlus, roles: ['clerk', 'operator'] },
  { label: 'Members', to: '/members', icon: Users, roles: ['clerk', 'treasurer', 'pastor', 'operator'] },
  { label: 'Counting Room', to: '/counting-room', icon: PiggyBank, roles: ['counter', 'operator'] },
  { label: 'Treasurer', to: '/treasurer', icon: ArrowUpRight, roles: ['treasurer', 'clerk', 'operator'] },
  { label: 'Reports', to: '/reports', icon: FileText, roles: ['clerk', 'treasurer', 'operator'] },
  { label: 'Import CSV', to: '/church/import', icon: FileDown, roles: ['clerk', 'operator'] },
  { label: 'Households', to: '/households', icon: Home, roles: ['clerk', 'operator'] },
  { label: 'Remittance', to: '/remittance', icon: ArrowUpRight, roles: ['treasurer', 'operator'] },
];

function DashboardPage() {
  const { churchId, churchName, role } = useAuth();
  const navigate = useNavigate();
  const goTo = useCallback((to: string) => navigate({ to } as never), [navigate]);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['insights', churchId],
    queryFn: () => fetchInsights(churchId!),
    enabled: !!churchId,
  });
  const insights = data?.insights ?? [];

  const visibleActions = QUICK_ACTIONS.filter(a => a.roles.includes(role ?? ''));

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-5 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          {churchName ?? 'Dashboard'}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">Your church at a glance</p>
      </div>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Insights</span>
          {insights.length > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-100 px-1.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
              {insights.length}
            </span>
          )}
        </div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-neutral-500">
              Failed to load insights. Pull to refresh or try again later.
            </CardContent>
          </Card>
        ) : insights.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {insights.map((insight, i) => {
              const Icon = INSIGHT_ICONS[insight.type] ?? FileText;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(insight.action.to)}
                  className="group rounded-xl border border-neutral-200/60 bg-white p-5 text-left shadow-sm transition-all hover:border-brand-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-brand-800"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-brand-700 dark:text-neutral-100 dark:group-hover:text-brand-400">
                    {insight.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-500">{insight.description}</p>
                  <div className="mt-3">
                    <Badge variant="default">{insight.action.label} →</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-10 text-center">
              <div className="mb-4 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                  <FileText className="h-7 w-7" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">No insights yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">
                Insights will appear as activity flows in — giving patterns, report reminders, and member updates.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Quick Actions</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibleActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group flex flex-col items-center gap-3 rounded-xl border border-neutral-200/60 bg-white p-5 text-center shadow-sm transition-all hover:border-brand-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-brand-800"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-400 dark:group-hover:bg-brand-900">
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 dark:text-neutral-300 dark:group-hover:text-neutral-100">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Getting Started</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              step: 1,
              title: 'Add your members',
              desc: 'Upload a CSV or add members one by one to build your church roll.',
              link: '/members/add',
              linkLabel: 'Add members',
            },
            {
              step: 2,
              title: 'Count today\'s offering',
              desc: 'Open a batch in the counting room. Two counters confirm before committing.',
              link: '/counting-room',
              linkLabel: 'Open counting room',
            },
            {
              step: 3,
              title: 'Invite your team',
              desc: 'Add a treasurer, counters, and pastor. Each role sees only what they need.',
              link: null,
              linkLabel: 'Available soon',
            },
          ].map((item) => (
            <Card key={item.step}>
              <CardContent className="p-5">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-xs font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  {item.step}
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">{item.desc}</p>
                {item.link ? (
                  <Link to={item.link} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
                    {item.linkLabel} →
                  </Link>
                ) : (
                  <span className="mt-3 inline-block text-xs text-neutral-400">{item.linkLabel}</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
