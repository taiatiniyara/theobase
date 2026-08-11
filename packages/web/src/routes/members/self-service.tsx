import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-store';
import { useMembers } from '../../lib/queries';
import { postChurchMutation } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

export const Route = createFileRoute('/members/self-service')({
  component: SelfServicePage,
});

function SelfServicePage() {
  const { churchId, email } = useAuth();
  const { data: members = [] } = useMembers(churchId!);
  const member = members.find(m => m.email === email);

  const [phone, setPhone] = useState(member?.phone ?? '');
  const [address, setAddress] = useState(member?.address ?? '');
  const [emailField, setEmailField] = useState(member?.email ?? '');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');

  if (!member) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-6">
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
      <div className="min-h-screen bg-neutral-50 px-4 py-6">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-lg font-semibold text-neutral-900">Update Submitted</h2>
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
    <div className="min-h-screen bg-neutral-50 px-4 py-6">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center gap-4">
          <Avatar size="lg"><AvatarFallback>{initials}</AvatarFallback></Avatar>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{member.firstName} {member.lastName}</h1>
            <p className="text-sm text-neutral-500">My Profile</p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Update Contact Information</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Phone</span>
                <Input value={phone} onChange={e => setPhone(e.target.value)} type="tel" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Email</span>
                <Input value={emailField} onChange={e => setEmailField(e.target.value)} type="email" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Address</span>
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
            <p className="text-sm text-neutral-500">Giving records will appear here once your church enables the treasurer module.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
