import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth-store';
import {
  fetchRestoreDrillStatus,
  triggerRestoreDrill,
  fetchPlacementRequests,
  confirmPlacementRequest,
  fetchOrgTree,
  seedReferenceSpine,
  purgeChurchDO,
} from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  AlertCircle,
  DollarSign,
  Activity,
  Shield,
  Building,
  Users,
  FolderTree,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';

type PanelId =
  | 'errors'
  | 'restore-drill'
  | 'cost'
  | 'health'
  | 'impersonation'
  | 'bootstrap'
  | 'org-tree'
  | 'placement-queue'
  | 'purge'
  | 'seed-demo'
  | 'bypass'
  | 'billing';

const TAB_LABELS: Record<PanelId, string> = {
  errors: 'Error Reports',
  'restore-drill': 'Restore Drill',
  cost: 'Cost Dashboard',
  health: 'Church Health',
  impersonation: 'Impersonation',
  bootstrap: 'Bootstrap Spine',
  'org-tree': 'Org Tree',
  'placement-queue': 'Placement Queue',
  purge: 'Purge Church',
  'seed-demo': 'Seed Demo',
  bypass: 'UI Bypass',
  billing: 'Billing Activation',
};

const TAB_ICONS: Record<PanelId, typeof AlertCircle> = {
  errors: AlertCircle,
  'restore-drill': RefreshCw,
  cost: DollarSign,
  health: Activity,
  impersonation: Shield,
  bootstrap: Building,
  'org-tree': Building,
  'placement-queue': Users,
  purge: FolderTree,
  'seed-demo': Download,
  bypass: Shield,
  billing: DollarSign,
};

function OperatorDashboard() {
  const { churchName, role } = useAuth();
  const [activeTab, setActiveTab] = useState<PanelId>('errors');
  const queryClient = useQueryClient();

  // Restore drill query
  const { data: drillData, isLoading: drillLoading } = useQuery({
    queryKey: ['restore-drill'],
    queryFn: fetchRestoreDrillStatus,
    refetchInterval: 60000,
  });

  const triggerDrillMutation = useMutation({
    mutationFn: triggerRestoreDrill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restore-drill'] });
    },
  });

  // Placement requests query
  const { data: placementRequests = [], isLoading: placementLoading } = useQuery({
    queryKey: ['placement-requests'],
    queryFn: fetchPlacementRequests,
  });

  const confirmMutation = useMutation({
    mutationFn: confirmPlacementRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placement-requests'] });
    },
  });

  // Org tree query
  const { data: orgTree, isLoading: orgTreeLoading } = useQuery({
    queryKey: ['org-tree'],
    queryFn: fetchOrgTree,
  });

  const seedMutation = useMutation({
    mutationFn: seedReferenceSpine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-tree'] });
    },
  });

  const purgeMutation = useMutation({
    mutationFn: purgeChurchDO,
  });

  // Tab bar layout: two rows
  const tabEntries = Object.entries(TAB_LABELS) as [PanelId, string][];
  const row1 = tabEntries.slice(0, 6);
  const row2 = tabEntries.slice(6, 12);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {churchName ?? 'Operator Dashboard'}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Platform maintainer — manage the whole system
        </p>
      </div>

      {/* Tab Bar */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {row1.map(([id, label]) => {
            const Icon = TAB_ICONS[id];
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {row2.map(([id, label]) => {
            const Icon = TAB_ICONS[id];
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel Content */}
      <div className="min-h-[400px]">
        {/* Error Reports Panel */}
        {activeTab === 'errors' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-neutral-900">Error Reports</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Error capture is active — payloads currently logged to console via
                    <code className="rounded bg-neutral-100 px-1">POST /observability/error</code>.
                    Will persist to D1 <code className="rounded bg-neutral-100 px-1">error_log</code>
                    in v1.5. No storage or querying in this release.
                  </p>
                  <div className="mt-4">
                    <Badge variant="default">console‑log only</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Restore Drill Panel */}
        {activeTab === 'restore-drill' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-neutral-900">Monthly Restore Drill</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    The monthly cron replay runs automatically. This panel shows the last result.
                  </p>
                  {drillLoading ? (
                    <div className="mt-4 h-20 animate-pulse rounded-lg bg-neutral-100" />
                  ) : drillData ? (
                    <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                      <div className="flex items-center gap-2">
                        {drillData.state.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="text-sm font-medium text-neutral-900">
                          Last drill: {drillData.state.success ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-neutral-500">
                        Church: {drillData.state.churchId} •{' '}
                        {new Date(drillData.state.timestamp).toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        State hash match: {drillData.state.stateHashMatch ? 'Yes' : 'No'}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-neutral-500">No drill data available.</p>
                  )}
                  <button
                    onClick={() => triggerDrillMutation.mutate()}
                    disabled={triggerDrillMutation.isPending}
                    className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {triggerDrillMutation.isPending ? 'Triggering…' : 'Trigger Manual Drill'}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cost Dashboard Panel */}
        {activeTab === 'cost' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-neutral-900">Cost Dashboard</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    $3/church/month validated by v1.5 observability UI. Current billing data
                    not yet surfaced. This panel declares the intent without fake metrics.
                  </p>
                  <div className="mt-4">
                    <Badge variant="default">v1.5 pending</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Church Health Panel */}
        {activeTab === 'health' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-neutral-900">Church Health</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Select a church to view health details. Operator can inspect any church
                    after login — sync latency, error count, queue depth from
                    <code className="rounded bg-neutral-100 px-1">GET /church/:id/state</code>.
                  </p>
                  <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm text-neutral-700">
                      Church health metrics will appear here once a church is selected.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Impersonation Panel */}
        {activeTab === 'impersonation' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-neutral-900">Impersonate Any Role</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    No session‑swap audit yet (Q2b follow‑on). This selects a role to filter
                    the dashboard view for debugging purposes.
                  </p>
                  <div className="mt-4">
                    <Badge variant="default">session audit pending</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bootstrap Spine Panel */}
        {activeTab === 'bootstrap' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <Building className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-neutral-900">Bootstrap Reference Spine</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Loads the checked‑in Fiji reference spine (GC → SPD → TPUM → Fiji Mission →
                    Suva Central). Controlled by <code className="rounded bg-neutral-100 px-1">SEED_TOKEN</code>,
                    not production data.
                  </p>
                  <button
                    onClick={() => seedMutation.mutate()}
                    disabled={seedMutation.isPending}
                    className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {seedMutation.isPending ? 'Loading…' : 'Load Reference Spine'}
                  </button>
                  <p className="mt-2 text-xs text-neutral-500">
                    ADR‑0018 §5: whether this stays as the operator's bootstrap tool or is removed
                    when the tree‑UI ships is open.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Org Tree Panel */}
        {activeTab === 'org-tree' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <Building className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-neutral-900">Org Tree Authoring</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Basic authoring UI. Create conference unit, re‑parent, change status. Every
                    action writes <code className="rounded bg-neutral-100 px-1">orgUnit</code>,
                    <code className="rounded bg-neutral-100 px-1">roleGrant</code>, and
                    <code className="rounded bg-neutral-100 px-1">orgAudit</code> rows.
                  </p>
                  {orgTreeLoading ? (
                    <div className="mt-4 h-32 animate-pulse rounded-lg bg-neutral-100" />
                  ) : orgTree ? (
                    <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                      <p className="text-sm text-neutral-700">Org tree data loaded.</p>
                      <pre className="mt-2 overflow-auto text-xs text-neutral-600">
                        {JSON.stringify(orgTree, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-neutral-500">No org tree data available.</p>
                  )}
                  <button
                    onClick={() => window.location.href = '/operator/tree'}
                    className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                  >
                    Open Full Tree View
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Placement Queue Panel */}
        {activeTab === 'placement-queue' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-neutral-900">Placement Queue</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    The operator's approval queue. Conference admins file placement requests;
                    the operator confirms or corrects each one.
                  </p>
                  {placementLoading ? (
                    <div className="mt-4 h-20 animate-pulse rounded-lg bg-neutral-100" />
                  ) : placementRequests.length === 0 ? (
                    <p className="mt-4 text-sm text-neutral-500">
                      No pending placement requests at this time.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {placementRequests.map((req) => (
                        <li
                          key={req.id}
                          className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                        >
                          <div className="font-medium text-neutral-900">{req.name}</div>
                          <p className="text-xs text-neutral-500">
                            Territory: {req.territory} • Suggested: {req.suggestedParentId}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => confirmMutation.mutate(req.id)}
                              disabled={confirmMutation.isPending}
                              className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                              Correct
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-4">
                    <Badge variant="default">Phase 1 human gate</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Purge Church Panel */}
        {activeTab === 'purge' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <FolderTree className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-neutral-900">Purge a Church DO</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Destructive operation: this will wipe all data for the selected church.
                    Requires second confirmation. Writes an
                    <code className="rounded bg-neutral-100 px-1">orgAudit</code> row.
                  </p>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-700">
                      Church ID
                    </label>
                    <input
                      type="text"
                      placeholder="Enter church ID to purge"
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const churchId = prompt('Enter church ID to purge:');
                      if (churchId && confirm(`Are you sure you want to purge church ${churchId}? This cannot be undone.`)) {
                        purgeMutation.mutate(churchId);
                      }
                    }}
                    disabled={purgeMutation.isPending}
                    className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {purgeMutation.isPending ? 'Purging…' : 'Purge Church DO'}
                  </button>
                  <p className="mt-2 text-xs text-red-500">
                    ADR‑0018 §11: append‑only <code className="rounded bg-neutral-100 px-1">orgAudit</code> rows record every mutation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seed Demo Panel */}
        {activeTab === 'seed-demo' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
                  <Download className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-neutral-900">Seed Demo Church</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    <strong>Warning:</strong> ADR‑0018 kills the demo seed. This is for dev /
                    restore‑drill only. Confirm before provisioning Suva Central with synthetic
                    members, giving, and demo accounts.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to seed the demo church? This is for dev/restore-drill only.')) {
                        // Would call seed demo endpoint
                        alert('Demo church seeded (stub).');
                      }
                    }}
                    className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Seed Demo Church
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bypass Panel */}
        {activeTab === 'bypass' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-neutral-900">UI Bypass Status</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Operator bypass: always active for super‑admin JWT. Code‑level short‑circuit
                    in <code className="rounded bg-neutral-100 px-1">canOperate()</code> and
                    <code className="rounded bg-neutral-100 px-1">RequireAuth</code>. No runtime toggle.
                  </p>
                  <div className="mt-4">
                    <Badge variant="default">always active</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Panel */}
        {activeTab === 'billing' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-neutral-900">Billing Activation</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Pending — issue #243. Will flip <code className="rounded bg-neutral-100 px-1">constituted → organized</code> once built.
                  </p>
                  <Badge variant="default">v1.5 pending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between text-xs text-neutral-500">
        <span>{role === 'operator' ? 'Super Admin' : 'Limited'} — no PII accessed</span>
        <span>Sync indicator</span>
      </footer>
    </div>
  );
}

export default OperatorDashboard;

export const Route = createFileRoute('/operator/')({
  component: OperatorDashboard,
});