import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-store';
import { useMembers, useUpdateMember, useDeleteMember, useStateChangeMutation } from '../../lib/queries';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import { MemberForm } from '../../components/features/member-form';
import { VALID_TRANSITIONS, type MembershipState } from '@theobase/shared';
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
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newState, setNewState] = useState('');
  const [reason, setReason] = useState('');
  const stateChangeMutation = useStateChangeMutation(churchId!);

  const member = members?.find((m) => m.id === memberId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-neutral-200" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-neutral-600">Member not found</p>
        </div>
      </div>
    );
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

  async function handleStateChange() {
    if (!newState || !member) return;
    const updatedMember = {
      ...member,
      membershipStatus: newState,
    };
    await stateChangeMutation.mutateAsync({
      memberId: memberId,
      prevState: member.membershipStatus,
      newState,
      updatedMember: updatedMember as Member,
    });
    setNewState('');
    setReason('');
  }

  async function handleSubmit(data: InsertMember) {
    await updateMember.mutateAsync(data);
    navigate({ to: '/members' });
  }

  async function handleDelete() {
    await deleteMember.mutateAsync(memberId);
    navigate({ to: '/members' });
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Edit Member</CardTitle>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Member</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete {member.firstName} {member.lastName}? This
                    action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteMember.isPending}
                  >
                    {deleteMember.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <MemberForm
              member={member}
              onSubmit={handleSubmit}
              onCancel={() => navigate({ to: '/members' })}
              isLoading={updateMember.isPending}
            />

            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Membership Status</h3>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-neutral-500">Current:</span>
                <Badge variant={statusBadgeVariant(member.membershipStatus)}>
                  {member.membershipStatus}
                </Badge>
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
                <>
                  <label className="block mt-3">
                    <span className="text-sm font-medium text-neutral-700">Reason (optional)</span>
                    <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for change" />
                  </label>
                  <Button
                    className="mt-3"
                    onClick={handleStateChange}
                    disabled={stateChangeMutation.isPending}
                  >
                    {stateChangeMutation.isPending ? 'Updating...' : `Change to ${newState}`}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
