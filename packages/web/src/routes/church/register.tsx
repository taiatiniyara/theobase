import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-store';
import { getAuthWorkerUrl } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';

export const Route = createFileRoute('/church/register')({
  component: ChurchRegisterPage,
});

function ChurchRegisterPage() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getAuthWorkerUrl()}/church/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address }),
      });
      if (res.ok) {
        const data = (await res.json()) as { churchId: string; token: string };
        login(data.token);
        localStorage.setItem('churchId', data.churchId);
        navigate({ to: '/' });
      } else {
        const err = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
        setError((err as { error?: string }).error ?? `Server error (${res.status})`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/logo-full.svg" alt="Theobase" className="mx-auto mb-6 h-8 w-auto dark:hidden" />
          <img src="/logo-full-light.svg" alt="Theobase" className="mx-auto mb-6 hidden h-8 w-auto dark:block" />
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Register your church
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Set up your church on Theobase to start managing membership and giving.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {error && (
              <div className="rounded-lg bg-error-light px-4 py-3 text-sm text-error-700 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Church Name</span>
                <Input
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Suva Central SDA Church"
                  className="mt-1.5"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Address</span>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Church address (optional)"
                  className="mt-1.5"
                />
              </label>
              <Button type="submit" className="w-full" isLoading={loading}>
                {loading ? 'Creating church...' : 'Create Church'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
          Already have a church?{' '}
          <button
            type="button"
            onClick={() => navigate({ to: '/login' })}
            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
