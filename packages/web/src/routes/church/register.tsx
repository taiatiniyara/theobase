import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-store';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';

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
      const res = await fetch('/church/register', {
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-md space-y-6">
        <h1 className="text-xl font-bold text-neutral-900">Register Your Church</h1>
        {error && (
          <div className="rounded-md bg-error-light px-4 py-3 text-sm text-error-700">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Church Name</span>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Suva Central SDA Church"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Address</span>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Church address"
            />
          </label>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Church'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
