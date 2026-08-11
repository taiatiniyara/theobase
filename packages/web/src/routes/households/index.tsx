import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth-store';
import { RequireAuth } from '../../lib/auth-guard';
import { useMembers } from '../../lib/queries';
import { postChurchMutation } from '../../lib/api';
import { suggestHouseholds, type HouseholdSuggestion } from '@theobase/shared';
import type { Member } from '@theobase/shared';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { SkeletonCard } from '../../components/ui/skeleton';
import { useToast } from '../../lib/toast';

export const Route = createFileRoute('/households/')({
  component: HouseholdsPage,
});

function HouseholdsPage() {
  const { churchId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: members = [], isLoading, isError } = useMembers(churchId!);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (isError) {
    return (
      <RequireAuth allowedRoles={['clerk']}>
        <div className="px-4 py-6">
          <div className="mx-auto max-w-3xl text-center py-24">
            <h2 className="text-xl font-semibold text-neutral-900">Failed to load members</h2>
            <p className="mt-2 text-neutral-500">Something went wrong while fetching member data.</p>
            <Button
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['members', 'list', churchId] })}
            >
              Retry
            </Button>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (isLoading) {
    return (
      <RequireAuth allowedRoles={['clerk']}>
        <div className="px-4 py-6">
          <div className="mx-auto max-w-3xl space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </RequireAuth>
    );
  }

  const suggestions = suggestHouseholds(members as Member[]);

  const visibleSuggestions = suggestions.filter(s => {
    const key = s.memberIds.join(',');
    return !confirmed.has(key) && !rejected.has(key);
  });

  async function handleConfirm(s: HouseholdSuggestion) {
    const key = s.memberIds.join(',');
    setActionLoading(key);
    try {
      await postChurchMutation(churchId!, 'household:create', {
        id: crypto.randomUUID(),
        churchId: churchId!,
        name: s.suggestedName,
        memberIds: s.memberIds,
        reason: s.reason,
      });
      setConfirmed(prev => new Set(prev).add(key));
      queryClient.invalidateQueries({ queryKey: ['members', 'list', churchId] });
      toast('Household group created', 'success');
    } catch {
      toast('Failed to create household group', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(s: HouseholdSuggestion) {
    const key = s.memberIds.join(',');
    setActionLoading(key);
    try {
      await postChurchMutation(churchId!, 'household:suggestions', {
        memberIds: s.memberIds,
        suggestedName: s.suggestedName,
        reason: s.reason,
      });
      setRejected(prev => new Set(prev).add(key));
      queryClient.invalidateQueries({ queryKey: ['members', 'list', churchId] });
      toast('Suggestion dismissed', 'success');
    } catch {
      toast('Failed to dismiss suggestion', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  if (suggestions.length === 0 && rejected.size + confirmed.size === 0) {
    return (
      <RequireAuth allowedRoles={['clerk']}>
        <div className="px-4 py-6">
          <div className="mx-auto max-w-3xl text-center py-24">
            <h2 className="text-xl font-semibold text-neutral-900">No household suggestions</h2>
            <p className="mt-2 text-neutral-500">All members are already grouped or no patterns found.</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth allowedRoles={['clerk']}>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-2xl font-bold text-neutral-900">Household Suggestions</h1>

          {visibleSuggestions.length === 0 && (confirmed.size > 0 || rejected.size > 0) && (
            <p className="text-center text-neutral-500 py-12">All suggestions reviewed.</p>
          )}

          {visibleSuggestions.map((s, i) => {
            const key = s.memberIds.join(',');
            return (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{s.suggestedName}</CardTitle>
                      <p className="mt-1 text-sm text-neutral-500">Based on {s.reason.replace('-', ' ')}</p>
                    </div>
                    <Badge variant="warning">Suggestion</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-wrap gap-3">
                    {s.memberIds.map(id => {
                      const member = members.find(m => m.id === id);
                      if (!member) return null;
                      const initials = `${member.firstName?.[0] ?? ''}${member.lastName?.[0] ?? ''}`;
                      return (
                        <div key={id} className="flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1">
                          <Avatar size="sm"><AvatarFallback>{initials}</AvatarFallback></Avatar>
                          <span className="text-sm">{member.firstName} {member.lastName}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => handleConfirm(s)} disabled={actionLoading !== null}>
                      {actionLoading === key ? 'Confirming...' : 'Confirm Group'}
                    </Button>
                    <Button variant="ghost" onClick={() => handleReject(s)} disabled={actionLoading !== null}>
                      {actionLoading === key ? 'Skipping...' : 'Skip'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </RequireAuth>
  );
}
