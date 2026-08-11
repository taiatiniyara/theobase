import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-store';
import { useMembers } from '../../lib/queries';
import { fetchChurchState, postChurchMutation } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

export const Route = createFileRoute('/members/self-service')({
  component: SelfServicePage,
});

function SelfServicePage() {
  const { churchId, email } = useAuth();
  const { data: members = [], isLoading: membersLoading } = useMembers(churchId!);
  const member = members.find(m => m.email === email);

  const [phone, setPhone] = useState(member?.phone ?? '');
  const [address, setAddress] = useState(member?.address ?? '');
  const [emailField, setEmailField] = useState(member?.email ?? '');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');

  const { data: churchState, isLoading: givingLoading } = useQuery({
    queryKey: ['church-state', churchId],
    queryFn: () => fetchChurchState(churchId!),
    enabled: !!member && !!churchId,
  });

  const givingRecords = Object.values((churchState?.givingRecords as Record<string, Record<string, unknown>>) ?? {});
  const myRecords = givingRecords.filter(r => r.memberId === member?.id);
  const totalTithe = myRecords.filter(r => r.type === 'tithe').reduce((s, r) => s + ((r.amount as number) ?? 0), 0);
  const totalOffering = myRecords.filter(r => r.type === 'offering').reduce((s, r) => s + ((r.amount as number) ?? 0), 0);

  if (membersLoading) {
    return (
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg space-y-4">
          <div className="h-20 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-40 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-32 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg text-center py-24">
          <p className="text-neutral-600">Member record not found.</p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    await postChurchMutation(churchId!, 'contact:update-request', {
      memberId: member!.id,
      updates: { phone: phone || null, address: address || null, email: emailField || null },
    });
    setStatus('submitted');
  }

  if (status === 'submitted') {
    return (
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Update Submitted</h2>
              <p className="mt-2 text-neutral-500">Your contact update has been sent to the church clerk for approval.</p>
              <Button className="mt-6" variant="ghost" onClick={() => setStatus('idle')}>Submit Another</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const initials = `${member.firstName?.[0] ?? ''}${member.lastName?.[0] ?? ''}`;

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center gap-4">
          <Avatar size="lg"><AvatarFallback>{initials}</AvatarFallback></Avatar>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{member.firstName} {member.lastName}</h1>
            <p className="text-sm text-neutral-500">My Profile</p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Update Contact Information</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Phone</span>
                <Input value={phone} onChange={e => setPhone(e.target.value)} type="tel" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</span>
                <Input value={emailField} onChange={e => setEmailField(e.target.value)} type="email" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Address</span>
                <Input value={address} onChange={e => setAddress(e.target.value)} />
              </label>
              <Button type="submit" className="w-full" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>My Giving History</CardTitle></CardHeader>
          <CardContent>
            {givingLoading ? (
              <div className="space-y-2">
                <div className="h-6 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-6 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
            ) : myRecords.length === 0 ? (
              <p className="text-sm text-neutral-500">No giving records found.</p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-neutral-500">Tithe</div>
                    <div className="text-lg font-bold tabular-nums">${totalTithe.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">Offerings</div>
                    <div className="text-lg font-bold tabular-nums">${totalOffering.toFixed(2)}</div>
                  </div>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {myRecords.slice(0, 20).map((r: Record<string, unknown>, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">{r.type as string}</span>
                      <span className="font-medium tabular-nums">${(r.amount as number).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
