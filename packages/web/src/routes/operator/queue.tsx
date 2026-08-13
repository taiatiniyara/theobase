import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { fetchPlacementRequests, confirmPlacementRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Users } from 'lucide-react';

function PlacementQueuePage() {
  const queryClient = useQueryClient();

  const { data: placementRequests = [], isLoading } = useQuery({
    queryKey: ['placement-requests'],
    queryFn: fetchPlacementRequests,
  });

  const confirmMutation = useMutation({
    mutationFn: confirmPlacementRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placement-requests'] });
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Placement Queue
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            The operator's approval queue. Conference admins file placement requests;
            the operator confirms or corrects each one.
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/operator'}
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          ← Back to Dashboard
        </button>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-neutral-500 mb-4">
            One click confirms → creates <code className="rounded bg-neutral-100 px-1">org_unit</code>,
            grants <code className="rounded bg-neutral-100 px-1">conference-admin</code> +
            <code className="rounded bg-neutral-100 px-1">conference-treasurer</code> via
            <code className="rounded bg-neutral-100 px-1">roleGrant</code>.
            Operator can correct the suggestion instead of affirming it.
          </p>

          {isLoading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-100" />
              ))}
            </div>
          ) : placementRequests.length === 0 ? (
            <div className="mt-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-neutral-900">
                No pending requests
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">
                Conference admins will file placement requests here. You'll confirm or correct
                each one with a single click.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {placementRequests.map((req) => (
                <li
                  key={req.id}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-neutral-900">{req.name}</div>
                      <p className="text-xs text-neutral-500">
                        Requested by: {req.requestedBy}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Territory: {req.territory} • Suggested parent: {req.suggestedParentId}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Status: <Badge variant="default">{req.status}</Badge>
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => confirmMutation.mutate(req.id)}
                      disabled={confirmMutation.isPending}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                      Correct
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6">
            <Badge variant="default">Phase 1 human gate</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PlacementQueuePage;

export const Route = createFileRoute('/operator/queue')({
  component: PlacementQueuePage,
});