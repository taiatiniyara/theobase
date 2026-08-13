import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-store';
import { getAuthWorkerUrl } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select';

export const Route = createFileRoute('/church/register')({
  component: ChurchRegisterPage,
});

interface OrgTreeConference {
  id: string;
  name: string;
  kind: string;
  children: { id: string; name: string; kind: string }[];
}

interface OrgTreeUnion {
  id: string;
  name: string;
  kind: string;
  conferences: OrgTreeConference[];
}

interface OrgTreeDivision {
  id: string;
  name: string;
  kind: string;
  unions: OrgTreeUnion[];
}

function ChurchRegisterPage() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [clerkEmail, setClerkEmail] = useState('');
  const [divisions, setDivisions] = useState<OrgTreeDivision[]>([]);
  const [divisionId, setDivisionId] = useState('');
  const [unionId, setUnionId] = useState('');
  const [conferenceId, setConferenceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [parentName, setParentName] = useState<string | null>(null);
  const navigate = useNavigate();
  const { churchId } = useAuth();

  useEffect(() => {
    if (churchId) {
      navigate({ to: '/' });
    }
  }, [churchId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${getAuthWorkerUrl()}/org/tree`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { divisions: OrgTreeDivision[] };
        if (!cancelled) {
          setDivisions(data.divisions ?? []);
          if (!data.divisions || data.divisions.length === 0) {
            setTreeError('No conference is ready to receive registrations yet. Please try again later.');
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTreeError('Could not load the organization tree. Please check your connection and try again.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedDivision = divisions.find((d) => d.id === divisionId);
  const unions = selectedDivision?.unions ?? [];
  const selectedUnion = unions.find((u) => u.id === unionId);
  const conferences = selectedUnion?.conferences ?? [];

  function handleDivisionChange(value: string) {
    setDivisionId(value);
    setUnionId('');
    setConferenceId('');
  }

  function handleUnionChange(value: string) {
    setUnionId(value);
    setConferenceId('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getAuthWorkerUrl()}/church/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address: address || undefined,
          email: clerkEmail,
          parentId: conferenceId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
        setError((err as { error?: string }).error ?? `Server error (${res.status})`);
      } else {
        const body = (await res.json()) as { parentName?: string };
        setParentName(body.parentName ?? null);
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
            {parentName ? (
              <>
                <span className="font-medium text-neutral-700">{name}</span> is registered under{' '}
                <span className="font-medium text-neutral-700">{parentName}</span>. We sent a sign-in
                link to <span className="font-medium text-neutral-700">{clerkEmail}</span> — open it to
                access your church dashboard.
              </>
            ) : (
              <>
                We sent a sign-in link to{' '}
                <span className="font-medium text-neutral-700">{clerkEmail}</span>. Open it to access
                your church dashboard.
              </>
            )}
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
            Choose your Division, Union and Conference/Mission, then create your church on Theobase.
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
                <span className="text-sm font-medium text-neutral-700">Division</span>
                <Select value={divisionId} onValueChange={handleDivisionChange}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Union</span>
                <Select value={unionId} onValueChange={handleUnionChange} disabled={!divisionId}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder={divisionId ? 'Select union' : 'Select a division first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {unions.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Conference / Mission</span>
                <Select
                  value={conferenceId}
                  onValueChange={setConferenceId}
                  disabled={!unionId}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder={unionId ? 'Select conference' : 'Select a union first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {conferences.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

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
              {treeError && !divisions.length && (
                <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {treeError}
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                isLoading={loading}
                disabled={!conferenceId}
              >
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