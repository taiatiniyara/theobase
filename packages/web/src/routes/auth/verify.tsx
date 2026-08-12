import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-store';
import { getAuthWorkerUrl } from '../../lib/api';

export const Route = createFileRoute('/auth/verify')({
  component: VerifyPage,
});

function VerifyPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setError('No sign-in link found.');
      return;
    }
    fetch(`${getAuthWorkerUrl()}/auth/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Invalid or expired link.');
        const data = (await res.json()) as { token: string };
        login(data.token);
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
        <p className="text-neutral-600">{error}</p>
        <button onClick={() => navigate({ to: '/login' })} className="mt-4 text-sm font-medium text-brand-600">
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
      <p className="text-neutral-500">Signing you in...</p>
    </div>
  );
}
