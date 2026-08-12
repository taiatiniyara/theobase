import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-store';
import { RequireAuth } from '../../lib/auth-guard';
import { getAuthWorkerUrl } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export const Route = createFileRoute('/conference/placement')({
  component: ConferencePlacementPage,
});

function ConferencePlacementPage() {
  const { churchId, role } = useAuth();
  const [name, setName] = useState('');
  const [territory, setTerritory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    id: string;
    name: string;
    territory: string;
    suggestedParentId: string;
    status: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${getAuthWorkerUrl()}/placement/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
        },
        body: JSON.stringify({ name, territory }),
      });
      const data = (await res.json()) as {
        error?: string;
        id?: string;
        name?: string;
        territory?: string;
        suggestedParentId?: string;
        status?: string;
      };
      if (!res.ok) {
        setError(data.error ?? `Server error (${res.status})`);
      } else {
        setResult({
          id: data.id!,
          name: data.name!,
          territory: data.territory!,
          suggestedParentId: data.suggestedParentId!,
          status: data.status!,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection problem. Please check your internet.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <RequireAuth allowedRoles={['conference-treasurer', 'conference-secretary', 'conference-president']}>
      <div className="min-h-screen bg-neutral-50 px-4 py-10">
        <div className="mx-auto max-w-xl">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Request conference placement
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            File a request to place a new conference in the hierarchy. Your placement is
            reviewed by an operator before anything appears in the published tree.
          </p>

          {result ? (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="rounded-lg border border-success-light bg-success-light/40 px-4 py-3">
                  <p className="text-sm font-medium text-success">Request filed</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    <span className="font-medium text-neutral-900">{result.name}</span> ({result.territory})
                    is pending review under{' '}
                    <span className="font-medium text-neutral-900">{result.suggestedParentId}</span>.
                  </p>
                </div>
                <Button
                  className="mt-4"
                  variant="secondary"
                  onClick={() => {
                    setName('');
                    setTerritory('');
                    setResult(null);
                  }}
                >
                  File another request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Placement details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
                      Conference name
                    </label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rotuma Mission"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="territory" className="block text-sm font-medium text-neutral-700">
                      Territory
                    </label>
                    <textarea
                      id="territory"
                      value={territory}
                      onChange={(e) => setTerritory(e.target.value)}
                      placeholder="e.g. Rotuma, Fiji"
                      required
                      className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none"
                      rows={3}
                    />
                    <p className="mt-1 text-xs text-neutral-500">
                      We suggest the Union/Division for this territory from the existing tree.
                    </p>
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Submitting...' : 'Submit placement request'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
          <p className="mt-4 text-xs text-neutral-400">
            Signed in as {churchId ?? 'unknown unit'} · {role ?? 'no role'}
          </p>
        </div>
      </div>
    </RequireAuth>
  );
}