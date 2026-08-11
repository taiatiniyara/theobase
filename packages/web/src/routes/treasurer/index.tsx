import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth-store';
import { RequireAuth } from '../../lib/auth-guard';
import { useMembers } from '../../lib/queries';
import { fetchChurchState, postChurchMutation } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { SkeletonCard } from '../../components/ui/skeleton';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select';
import { Inbox, AlertTriangle, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  { value: 'tithe', label: 'Tithe' },
  { value: 'sabbath-school', label: 'Sabbath School' },
  { value: 'local-church-budget', label: 'Local Budget' },
  { value: 'conference-advance', label: 'Conference Advance' },
  { value: 'world-budget', label: 'World Budget' },
  { value: 'building-fund', label: 'Building Fund' },
  { value: 'adra', label: 'ADRA' },
];

export const Route = createFileRoute('/treasurer/')({
  component: TreasurerPage,
});

function TreasurerPage() {
  const { churchId } = useAuth();
  const { data: members = [] } = useMembers(churchId!);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showExternalForm, setShowExternalForm] = useState(false);
  const [extMemberId, setExtMemberId] = useState('');
  const [extAmount, setExtAmount] = useState('');
  const [extCategory, setExtCategory] = useState('tithe');
  const [extType, setExtType] = useState('offering');
  const [extDate, setExtDate] = useState(new Date().toISOString().split('T')[0]);
  const [extPaymentMethod, setExtPaymentMethod] = useState('electronic');
  const [extLoading, setExtLoading] = useState(false);
  const [depositDialogBatchId, setDepositDialogBatchId] = useState<string | null>(null);
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [depositRef, setDepositRef] = useState('');

  const { data: state, isLoading, isError } = useQuery({
    queryKey: ['church-state', churchId],
    queryFn: () => fetchChurchState(churchId!),
    enabled: !!churchId,
    refetchInterval: 10000,
  });

  const batches = Object.values((state?.givingBatches as Record<string, Record<string, unknown>>) ?? {});
  const committedBatches = batches.filter(b => b.status === 'committed' || b.status === 'deposited');
  const givingRecords = Object.values((state?.givingRecords as Record<string, Record<string, unknown>>) ?? {});

  async function handleMarkDeposited(batchId: string) {
    setDepositDialogBatchId(batchId);
    setDepositDate(new Date().toISOString().split('T')[0]);
    setDepositRef('');
  }

  async function confirmDeposit() {
    if (!depositDialogBatchId) return;
    try {
      await postChurchMutation(churchId!, 'giving_batch:deposit', {
        batchId: depositDialogBatchId,
        depositDate: depositDate,
        depositRef: depositRef,
      });
      setDepositDialogBatchId(null);
      toast('Batch marked as deposited', 'success');
      queryClient.invalidateQueries({ queryKey: ['church-state', churchId] });
    } catch {
      toast('Failed to mark batch as deposited', 'error');
    }
  }

  async function handleExternalRecord(e: React.FormEvent) {
    e.preventDefault();
    setExtLoading(true);
    try {
      const recordId = crypto.randomUUID();
      await postChurchMutation(churchId!, 'giving_record:create', {
        id: recordId,
        batchId: 'external',
        memberId: extMemberId,
        type: extType,
        amount: parseFloat(extAmount),
        category: extCategory,
        paymentMethod: extPaymentMethod,
        createdAt: new Date(extDate || new Date()).getTime() / 1000,
      });
      setShowExternalForm(false);
      setExtAmount('');
      setExtMemberId('');
      toast('External giving record created', 'success');
      queryClient.invalidateQueries({ queryKey: ['church-state', churchId] });
    } catch {
      toast('Failed to create giving record', 'error');
    } finally {
      setExtLoading(false);
    }
  }

  const totalGiving = givingRecords.reduce((s: number, r: Record<string, unknown>) => s + ((r.amount as number) ?? 0), 0);

  if (isLoading) {
    return (
      <RequireAuth allowedRoles={['treasurer']}>
      <div className="px-4 py-6 max-w-4xl mx-auto">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-56 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-10 w-40 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
            ))}
          </div>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
      </RequireAuth>
    );
  }

  if (isError) {
    return (
      <RequireAuth allowedRoles={['treasurer']}>
      <div className="px-4 py-6 max-w-4xl mx-auto">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-warning" />
              <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Failed to Load</h2>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Could not load church state data. Please try again.</p>
              <Button className="mt-6" variant="ghost" onClick={() => queryClient.invalidateQueries({ queryKey: ['church-state', churchId] })}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth allowedRoles={['treasurer']}>
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Treasurer Dashboard</h1>
          <Button onClick={() => setShowExternalForm(!showExternalForm)}>
            {showExternalForm ? 'Cancel' : 'Add External Record'}
          </Button>
        </div>

        <Card>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6">
            <div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">Total Giving</div>
              <div className="text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">${totalGiving.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">Committed Batches</div>
              <div className="text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">{committedBatches.length}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">Total Records</div>
              <div className="text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">{givingRecords.length}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">Deposited</div>
              <div className="text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">{batches.filter(b => b.status === 'deposited').length}</div>
            </div>
          </CardContent>
        </Card>

        {showExternalForm && (
          <Card>
            <CardHeader><CardTitle>Add External Giving Record</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleExternalRecord} className="space-y-4">
                <Select value={extMemberId} onValueChange={setExtMemberId}>
                  <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                  <SelectContent>
                    {members.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.firstName} {m.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={extType} onValueChange={setExtType}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tithe">Tithe</SelectItem>
                    <SelectItem value="offering">Offering</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={extCategory} onValueChange={setExtCategory}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" step="0.01" required placeholder="Amount" value={extAmount} onChange={e => setExtAmount(e.target.value)} />
                <Input type="date" value={extDate} onChange={e => setExtDate(e.target.value)} />
                <Select value={extPaymentMethod} onValueChange={setExtPaymentMethod}>
                  <SelectTrigger><SelectValue placeholder="Payment method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="electronic">Electronic</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="envelope">Envelope</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={extLoading}>{extLoading ? 'Saving...' : 'Save Record'}</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Committed Batches</CardTitle></CardHeader>
          <CardContent>
            {committedBatches.length === 0 ? (
              <div className="py-8 text-center">
                <Inbox className="mx-auto h-10 w-10 text-neutral-400 dark:text-neutral-500" />
                <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">No committed batches yet.</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">Batches will appear here once counters submit their records.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {committedBatches.map((b: Record<string, unknown>) => {
                  const c1Records = (b.counter1Records as Array<Record<string, unknown>>) ?? [];
                  const total = c1Records.reduce((s, r) => s + ((r.amount as number) ?? 0), 0);
                  return (
                    <div key={b.id as string} className="flex items-center justify-between rounded-md bg-neutral-50 dark:bg-neutral-800 px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{b.date as string}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {c1Records.length} records · {b.status as string}
                          {(b as Record<string, unknown>).depositRef ? ` · Ref: ${(b as Record<string, unknown>).depositRef}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">${total.toFixed(2)}</span>
                        {b.status !== 'deposited' && (
                          <Button variant="ghost" size="sm" onClick={() => handleMarkDeposited(b.id as string)}>
                            Mark Deposited
                          </Button>
                        )}
                        {b.status === 'deposited' && (
                          <Badge variant="success">Deposited</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Member Giving History</CardTitle>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Select a member to view their full giving history.</p>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="py-6 text-center">
                <Inbox className="mx-auto h-8 w-8 text-neutral-400 dark:text-neutral-500" />
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">No members found.</p>
                <Link to="/members" className="mt-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                  View Members <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {members.slice(0, 20).map(m => (
                  <button
                    key={m.id}
                    type="button"
                    className="rounded-md px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    onClick={() => navigate({ to: `/treasurer/member/${m.id}` })}
                  >
                    {m.firstName} {m.lastName}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={depositDialogBatchId !== null} onOpenChange={(open) => { if (!open) setDepositDialogBatchId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Batch as Deposited</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <label className="block">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Bank Deposit Date</span>
              <Input
                type="date"
                value={depositDate}
                onChange={e => setDepositDate(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Deposit Reference Number</span>
              <Input
                placeholder="Enter reference number"
                value={depositRef}
                onChange={e => setDepositRef(e.target.value)}
              />
            </label>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setDepositDialogBatchId(null)}>Cancel</Button>
              <Button onClick={confirmDeposit}>Confirm Deposit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </RequireAuth>
  );
}
