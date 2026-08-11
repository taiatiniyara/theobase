import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../../lib/auth-store';
import { useAddMember } from '../../lib/queries';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { MemberForm } from '../../components/features/member-form';
import type { InsertMember } from '@theobase/shared';

export const Route = createFileRoute('/members/add')({
  component: AddMemberPage,
});

function AddMemberPage() {
  const { churchId } = useAuth();
  const addMember = useAddMember(churchId!);
  const navigate = useNavigate();

  async function handleSubmit(data: InsertMember) {
    await addMember.mutateAsync(data);
    navigate({ to: '/members' });
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Add Member</CardTitle>
          </CardHeader>
          <CardContent>
            <MemberForm
              onSubmit={handleSubmit}
              onCancel={() => navigate({ to: '/members' })}
              isLoading={addMember.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
