import { createFileRoute, Link, useNavigate, Outlet, useRouterState } from '@tanstack/react-router';
import { useAuth } from '../../lib/auth-store';
import { useMembers, useAuditLog } from '../../lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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
  const navigate = useNavigate();
  const { data: members, isLoading } = useMembers(churchId!);
  const { data: auditLog = [] } = useAuditLog(churchId!, memberId);
  const member = members?.find((m) => m.id === memberId);
  const { location } = useRouterState();
  const isChildRoute = location.pathname.endsWith('/edit');

  if (isLoading) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-neutral-200" />
        ))}
      </div>
    );
  }

  if (isChildRoute) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <Outlet />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto text-center">
        <p className="text-neutral-500">Member not found</p>
      </div>
    );
  }

  const initials = `${member.firstName?.[0] ?? ''}${member.lastName?.[0] ?? ''}`;

  const statusVariant = (s: string): 'success' | 'warning' | 'error' | 'default' => {
    if (s === 'baptised') return 'success';
    if (s === 'transfer-in' || s === 'transfer-out') return 'warning';
    if (s === 'deceased' || s === 'removed') return 'error';
    return 'default';
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="text-brand-600 -ml-3" onClick={() => navigate({ to: '/members' })}>
          ← Members
        </Button>
        <Link to="/members/$memberId/edit" params={{ memberId }}>
          <Button variant="secondary" size="sm">Edit</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{member.firstName} {member.lastName}</CardTitle>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(member.membershipStatus)}>{member.membershipStatus}</Badge>
                {member.gender && <span className="text-sm text-neutral-500">{member.gender}</span>}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {member.email && <div><dt className="text-sm text-neutral-500">Email</dt><dd className="text-neutral-900 dark:text-neutral-100">{member.email}</dd></div>}
            {member.phone && <div><dt className="text-sm text-neutral-500">Phone</dt><dd className="text-neutral-900 dark:text-neutral-100">{member.phone}</dd></div>}
            {member.address && <div><dt className="text-sm text-neutral-500">Address</dt><dd className="text-neutral-900 dark:text-neutral-100">{member.address}</dd></div>}
            {member.dateOfBirth && <div><dt className="text-sm text-neutral-500">Date of Birth</dt><dd className="text-neutral-900 dark:text-neutral-100">{member.dateOfBirth}</dd></div>}
            {member.baptismDate && <div><dt className="text-sm text-neutral-500">Baptism Date</dt><dd className="text-neutral-900 dark:text-neutral-100">{member.baptismDate}</dd></div>}
            {member.householdId && <div><dt className="text-sm text-neutral-500">Household</dt><dd className="text-neutral-900 dark:text-neutral-100">{member.householdId}</dd></div>}
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
  );
}
