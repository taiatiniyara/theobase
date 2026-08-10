import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useSync } from '../../lib/sync-provider';
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
  const navigate = useNavigate();
  const { enqueue } = useSync();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/church/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address }),
      });
      if (res.ok) {
        const data = (await res.json()) as { churchId: string; token: string };
        localStorage.setItem('churchId', data.churchId);
        localStorage.setItem('token', data.token);
        await enqueue('church:create', { id: data.churchId, name, address, status: 'active' });
        navigate({ to: '/' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-md space-y-6">
        <h1 className="text-xl font-bold">Register Your Church</h1>
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
