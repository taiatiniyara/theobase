import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-store';
import { getAuthWorkerUrl } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { token?: string; redirect?: string };
  const { login, churchId } = useAuth();

  useEffect(() => {
    if (churchId) {
      navigate({ to: search.redirect || '/' });
    }
  }, [churchId]);

  useEffect(() => {
    const token = search.token;
    if (token) {
      setStatus('sending');
      fetch(`${getAuthWorkerUrl()}/auth/verify?token=${encodeURIComponent(token)}`)
        .then((res) => {
          if (!res.ok) throw new Error('Invalid token');
          return res.json();
        })
        .then((data: { token: string }) => {
          login(data.token);
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
      const res = await fetch(`${getAuthWorkerUrl()}/auth/send-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as Record<string, unknown>).message as string || 'Failed to send link');
      }

      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/logo-icon.svg" alt="Theobase" className="mx-auto mb-4 h-14 w-14" />
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Sign in to Theobase
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Enter your email to receive a magic link.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            {status === 'sent' ? (
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-light">
                  <svg className="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Check your email</h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    We sent a magic link to <span className="font-medium text-neutral-700 dark:text-neutral-300">{email}</span>.
                    Click the link to sign in.
                  </p>
                </div>
                <p className="text-xs text-neutral-400">
                  Didn't receive it? Check spam or{' '}
                  <button type="button" onClick={() => setStatus('idle')} className="text-brand-600 hover:text-brand-700">
                    try again
                  </button>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email address</span>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5"
                  />
                </label>

                {status === 'error' && (
                  <div className="rounded-lg bg-error-light px-4 py-3 text-sm text-error-700 dark:bg-red-900/20 dark:text-red-400">
                    {errorMsg}
                  </div>
                )}

                <Button type="submit" className="w-full" isLoading={status === 'sending'}>
                  {status === 'sending' ? 'Sending link...' : 'Send Login Link'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-neutral-400">
          New church?{' '}
          <button type="button" onClick={() => navigate({ to: '/church/register' })} className="font-medium text-brand-600 hover:text-brand-700">
            Register your church
          </button>
        </p>
      </div>
    </div>
  );
}
