import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-store';
import { useMembers, useUpdateMember, useDeleteMember } from '../../lib/queries';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import { MemberForm } from '../../components/features/member-form';
import type { InsertMember } from '@theobase/shared';

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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
