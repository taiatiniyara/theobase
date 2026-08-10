import { createFileRoute, Link } from '@tanstack/react-router';
import { useAuth } from '../../lib/auth-store';
import { useMembers, useAuditLog } from '../../lib/queries';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { AuditTimeline } from '../../components/features/audit-timeline';

export const Route = createFileRoute('/members/$memberId')({
  component: MemberProfilePage,
});

function MemberProfilePage() {
  const { memberId } = Route.useParams();
  const { churchId } = useAuth();
  const { data: members, isLoading } = useMembers(churchId!);
  const { data: auditLog = [] } = useAuditLog(churchId!, memberId);
  const member = members?.find((m) => m.id === memberId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardContent className="space-y-4 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-neutral-200" />
              ))}
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

  const initials = `${member.firstName?.[0] ?? ''}${member.lastName?.[0] ?? ''}`;

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                {member.firstName} {member.lastName}
              </h1>
              <p className="text-sm text-neutral-500">{member.email || 'No email'}</p>
            </div>
          </div>
          <Link to="/members/$memberId/edit" params={{ memberId }}>
            <Button variant="secondary">Edit</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-neutral-500">Status</dt>
                <dd><Badge variant={member.membershipStatus === 'baptised' ? 'success' : 'default'}>{member.membershipStatus}</Badge></dd>
              </div>
              {member.gender && (
                <div>
                  <dt className="text-sm text-neutral-500">Gender</dt>
                  <dd className="text-neutral-900">{member.gender}</dd>
                </div>
              )}
              {member.dateOfBirth && (
                <div>
                  <dt className="text-sm text-neutral-500">Date of Birth</dt>
                  <dd className="text-neutral-900">{member.dateOfBirth}</dd>
                </div>
              )}
              {member.baptismDate && (
                <div>
                  <dt className="text-sm text-neutral-500">Baptism Date</dt>
                  <dd className="text-neutral-900">{member.baptismDate}</dd>
                </div>
              )}
              {member.phone && (
                <div>
                  <dt className="text-sm text-neutral-500">Phone</dt>
                  <dd className="text-neutral-900">{member.phone}</dd>
                </div>
              )}
              {member.address && (
                <div>
                  <dt className="text-sm text-neutral-500">Address</dt>
                  <dd className="text-neutral-900">{member.address}</dd>
                </div>
              )}
              {member.householdId && (
                <div>
                  <dt className="text-sm text-neutral-500">Household</dt>
                  <dd className="text-neutral-900">{member.householdId}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Log</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditTimeline entries={auditLog} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
