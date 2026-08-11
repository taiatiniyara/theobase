import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-store';
import { RequireAuth } from '../../lib/auth-guard';
import { useMembers, useUpdateMember, useDeleteMember, useStateChangeMutation } from '../../lib/queries';
import { VALID_TRANSITIONS, type MembershipState } from '@theobase/shared';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import { MemberForm } from '../../components/features/member-form';
import type { InsertMember, Member } from '@theobase/shared';

export const Route = createFileRoute('/members/$memberId/edit')({
  component: EditMemberPage,
});

function EditMemberPage() {
  const { memberId } = Route.useParams();
  const { churchId } = useAuth();
  const { data: members, isLoading } = useMembers(churchId!);
  const updateMember = useUpdateMember(churchId!);
  const deleteMember = useDeleteMember(churchId!);
  const stateChangeMutation = useStateChangeMutation(churchId!);
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newState, setNewState] = useState('');
  const [reason, setReason] = useState('');

  const member = members?.find((m) => m.id === memberId);

  if (isLoading) {
    return (
      <RequireAuth allowedRoles={['clerk']}>
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-neutral-200" />
        ))}
      </div>
      </RequireAuth>
    );
  }

  if (!member) {
    return (
      <RequireAuth allowedRoles={['clerk']}>
      <div className="px-4 py-6 max-w-2xl mx-auto text-center">
        <p className="text-neutral-500">Member not found</p>
      </div>
      </RequireAuth>
    );
  }

  async function handleSubmit(data: InsertMember) {
    await updateMember.mutateAsync(data);
    navigate({ to: '/members' });
  }

  async function handleDelete() {
    await deleteMember.mutateAsync(memberId);
    navigate({ to: '/members' });
  }

  async function handleStateChange() {
    if (!newState || !member) return;
    try {
      const updatedMember = { ...member, membershipStatus: newState };
      await stateChangeMutation.mutateAsync({
        memberId,
        prevState: member.membershipStatus,
        newState,
        updatedMember: updatedMember as Member,
        reason: reason || undefined,
      });
      setNewState('');
      setReason('');
    } catch {
      // mutation failure handled gracefully by isPending/error state
    }
  }

  function statusBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
    switch (status) {
      case 'baptised': return 'success';
      case 'profession': return 'default';
      case 'transfer-in': case 'transfer-out': return 'warning';
      case 'deceased': case 'removed': return 'error';
      default: return 'default';
    }
  }

  return (
    <RequireAuth allowedRoles={['clerk']}>
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="text-brand-600 -ml-3" onClick={() => navigate({ to: `/members/${memberId}` })}>
          ← Back
        </Button>
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">Delete</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Member</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {member.firstName} {member.lastName}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteMember.isPending}>
                {deleteMember.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit {member.firstName} {member.lastName}</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberForm
            member={member}
            onSubmit={handleSubmit}
            onCancel={() => navigate({ to: `/members/${memberId}` })}
            isLoading={updateMember.isPending}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membership Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500">Current:</span>
            <Badge variant={statusBadgeVariant(member.membershipStatus)}>{member.membershipStatus}</Badge>
          </div>
          <Select value={newState} onValueChange={setNewState}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              {(VALID_TRANSITIONS[member.membershipStatus as MembershipState] ?? []).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {newState && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Reason (optional)</span>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for change" />
              </label>
              <Button onClick={handleStateChange} disabled={stateChangeMutation.isPending}>
                {stateChangeMutation.isPending ? 'Updating...' : `Change to ${newState}`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </RequireAuth>
  );
}
