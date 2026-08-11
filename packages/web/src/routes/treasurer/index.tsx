import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth-store';
import { useMembers } from '../../lib/queries';
import { fetchChurchState, postChurchMutation } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select';

const CATEGORIES = [
  { value: 'tithe', label: 'Tithe' },
  { value: 'sabbath-school', label: 'Sabbath School' },
  { value: 'local-church-budget', label: 'Local Budget' },
  { value: 'conference-advance', label: 'Conference Advance' },
  { value: 'world-budget', label: 'World Budget' },
  { value: 'building-fund', label: 'Building Fund' },
  { value: 'adra', label: 'ADRA' },
];

export const Route = createFileRoute('/treasurer')({
  component: TreasurerPage,
});

function TreasurerPage() {
  const { churchId } = useAuth();
  const { data: members = [] } = useMembers(churchId!);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const { data: state } = useQuery({
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
    await postChurchMutation(churchId!, 'giving_batch:deposit', {
      batchId: depositDialogBatchId,
      depositDate: depositDate,
      depositRef: depositRef,
    });
    setDepositDialogBatchId(null);
    queryClient.invalidateQueries({ queryKey: ['church-state', churchId] });
  }

  async function handleExternalRecord(e: React.FormEvent) {
    e.preventDefault();
    setExtLoading(true);
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
    setExtLoading(false);
    setShowExternalForm(false);
    setExtAmount('');
    setExtMemberId('');
    queryClient.invalidateQueries({ queryKey: ['church-state', churchId] });
  }

  const totalGiving = givingRecords.reduce((s: number, r: Record<string, unknown>) => s + ((r.amount as number) ?? 0), 0);

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Treasurer Dashboard</h1>
          <Button onClick={() => setShowExternalForm(!showExternalForm)}>
            {showExternalForm ? 'Cancel' : 'Add External Record'}
          </Button>
        </div>

        <Card>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6">
            <div>
              <div className="text-sm text-neutral-500">Total Giving</div>
              <div className="text-xl font-bold tabular-nums">${totalGiving.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-500">Committed Batches</div>
              <div className="text-xl font-bold tabular-nums">{committedBatches.length}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-500">Total Records</div>
              <div className="text-xl font-bold tabular-nums">{givingRecords.length}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-500">Deposited</div>
              <div className="text-xl font-bold tabular-nums">{batches.filter(b => b.status === 'deposited').length}</div>
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
              <p className="text-sm text-neutral-500 py-4 text-center">No committed batches yet.</p>
            ) : (
              <div className="space-y-2">
                {committedBatches.map((b: Record<string, unknown>) => {
                  const c1Records = (b.counter1Records as Array<Record<string, unknown>>) ?? [];
                  const total = c1Records.reduce((s, r) => s + ((r.amount as number) ?? 0), 0);
                  return (
                    <div key={b.id as string} className="flex items-center justify-between rounded-md bg-neutral-50 px-4 py-3">
                      <div>
                        <div className="text-sm font-medium">{b.date as string}</div>
                        <div className="text-xs text-neutral-500">
                          {c1Records.length} records · {b.status as string}
                          {(b as Record<string, unknown>).depositRef ? ` · Ref: ${(b as Record<string, unknown>).depositRef}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold tabular-nums">${total.toFixed(2)}</span>
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
            <p className="text-sm text-neutral-500">Select a member to view their full giving history.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {members.slice(0, 20).map(m => (
                <button
                  key={m.id}
                  type="button"
                  className="rounded-md px-3 py-2 text-left text-sm hover:bg-neutral-50"
                  onClick={() => navigate({ to: `/treasurer/member/${m.id}` })}
                >
                  {m.firstName} {m.lastName}
                </button>
              ))}
            </div>
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
              <span className="text-sm font-medium text-neutral-700">Bank Deposit Date</span>
              <Input
                type="date"
                value={depositDate}
                onChange={e => setDepositDate(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Deposit Reference Number</span>
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
  );
}
