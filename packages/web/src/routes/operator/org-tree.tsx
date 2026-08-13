import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { fetchOrgTree } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';

function OrgTreePage() {
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitTerritory, setNewUnitTerritory] = useState('');

  const { data: orgTree, isLoading } = useQuery({
    queryKey: ['org-tree'],
    queryFn: fetchOrgTree,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Org Tree — Author & Maintain
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            The operator authors and maintains the full org hierarchy (GC → Division →
            Union → Conference → Church).
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/operator'}
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          ← Back to Dashboard
        </button>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-neutral-500 mb-4">
            Every tree/grant/subscription mutation writes
            <code className="rounded bg-neutral-100 px-1">orgAudit</code> rows.
            Full re‑parent / rename deferred to follow‑on (O2 from Q3).
          </p>

          <div className="mt-6">
            <h3 className="text-base font-medium text-neutral-900">Create Conference Unit</h3>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Unit name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="e.g. Fiji Mission"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Territory
                </label>
                <input
                  type="text"
                  value={newUnitTerritory}
                  onChange={(e) => setNewUnitTerritory(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="e.g. Fiji"
                />
              </div>
              <div className="flex gap-2">
                <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                  + Create Conference Unit
                </button>
                <button
                  onClick={() => {
                    setNewUnitName('');
                    setNewUnitTerritory('');
                  }}
                  className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-base font-medium text-neutral-900">Existing Units</h3>
            {isLoading ? (
              <div className="mt-4 h-32 animate-pulse rounded-lg bg-neutral-100" />
            ) : orgTree ? (
              <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <pre className="overflow-auto text-xs text-neutral-600">
                  {JSON.stringify(orgTree, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">No org tree data available.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default OrgTreePage;

export const Route = createFileRoute('/operator/org-tree')({
  component: OrgTreePage,
});