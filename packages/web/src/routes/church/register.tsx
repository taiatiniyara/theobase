import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
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
  const [clerkEmail, setClerkEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const { churchId } = useAuth();

  useEffect(() => {
    if (churchId) {
      navigate({ to: '/' });
    }
  }, [churchId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getAuthWorkerUrl()}/church/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address: address || undefined, email: clerkEmail }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
        setError((err as { error?: string }).error ?? `Server error (${res.status})`);
      } else {
        setDone(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection problem. Please check your internet.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-success-light">
            <svg className="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900">Church created</h1>
          <p className="mt-2 text-sm text-neutral-500">
            We sent a sign-in link to <span className="font-medium text-neutral-700">{clerkEmail}</span>.
            Open it to access your church dashboard.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: '/login' })}
            className="mt-6 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/logo-full.svg" alt="Theobase" className="mx-auto mb-6 h-8 w-auto" />
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Set up your church
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Create your church on Theobase and get instant access as clerk.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {error && (
              <div className="rounded-lg bg-error-light px-4 py-3 text-sm text-error-700">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Church Name</span>
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
                <span className="text-sm font-medium text-neutral-700">Address</span>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Church address (optional)"
                  className="mt-1.5"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Your Email</span>
                <Input
                  required
                  type="email"
                  value={clerkEmail}
                  onChange={(e) => setClerkEmail(e.target.value)}
                  placeholder="clerk@example.com"
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-neutral-400">
                  You&rsquo;ll receive a sign-in link at this address.
                </p>
              </label>
              <Button type="submit" className="w-full" isLoading={loading}>
                {loading ? 'Creating church...' : 'Create Church'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-neutral-400">
          Already have a church?{' '}
          <button
            type="button"
            onClick={() => navigate({ to: '/login' })}
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
