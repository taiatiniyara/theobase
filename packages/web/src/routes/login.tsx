import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-store';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { token?: string };
  const { login } = useAuth();

  useEffect(() => {
    const token = search.token;
    if (token) {
      fetch(`/auth/verify?token=${encodeURIComponent(token)}`)
        .then((res) => {
          if (!res.ok) throw new Error('Invalid token');
          return res.json();
        })
        .then((data: { token: string }) => {
          login(data.token);
          navigate({ to: '/' });
        })
        .catch(() => {
          setStatus('error');
          setErrorMsg('Invalid or expired link. Please try again.');
        });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/auth/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || 'Failed to send link');
      }

      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-md space-y-6">
        <h1 className="text-xl font-bold">Sign In</h1>

        {status === 'sent' ? (
          <p className="text-sm text-neutral-600">Check your email for the login link.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Email</span>
              <Input
                type="email"
                required
                value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            {status === 'error' && (
              <p className="text-sm text-red-600">{errorMsg}</p>
            )}

            <Button type="submit" className="w-full" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending...' : 'Send Login Link'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
