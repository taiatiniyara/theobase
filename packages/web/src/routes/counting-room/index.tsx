import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth-store';
import { RequireAuth } from '../../lib/auth-guard';
import { useMembers } from '../../lib/queries';
import { postChurchMutation, fetchChurchState } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { NumericKeypad } from '../../components/features/numeric-keypad';
import { Skeleton, SkeletonLine } from '../../components/ui/skeleton';
import type { Member } from '@theobase/shared';

const CATEGORIES = [
  { value: 'tithe', label: 'Tithe', color: 'default' as const },
  { value: 'sabbath-school', label: 'Sabbath School', color: 'success' as const },
  { value: 'local-church-budget', label: 'Local Budget', color: 'default' as const },
  { value: 'conference-advance', label: 'Conference Advance', color: 'default' as const },
  { value: 'world-budget', label: 'World Budget', color: 'warning' as const },
  { value: 'building-fund', label: 'Building Fund', color: 'default' as const },
  { value: 'adra', label: 'ADRA', color: 'error' as const },
];

interface GivingRecord {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  category: string;
}

export const Route = createFileRoute('/counting-room/')({
  component: CountingRoomPage,
});

function CountingRoomPage() {
  const { churchId } = useAuth();
  const navigate = useNavigate();
  const { data: members = [], isLoading: membersLoading } = useMembers(churchId!);
  const [amount, setAmount] = useState('0');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('tithe');
  const [records, setRecords] = useState<GivingRecord[]>([]);
  const [batchOpen, setBatchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [batchId] = useState(() => crypto.randomUUID());
  const [confirming, setConfirming] = useState(false);
  const { toast } = useToast();

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members.slice(0, 10);
    const q = searchQuery.toLowerCase();
    return members.filter(m => 
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [members, searchQuery]);

  const handleNumber = useCallback((digit: string) => {
    setAmount(prev => prev === '0' ? digit : prev + digit);
  }, []);

  const handleDecimal = useCallback(() => {
    setAmount(prev => prev.includes('.') ? prev : prev + '.');
  }, []);

  const handleBackspace = useCallback(() => {
    setAmount(prev => prev.length <= 1 ? '0' : prev.slice(0, -1));
  }, []);

  const quickAmounts = [5, 10, 20, 50, 100];

  function handleQuickAmount(value: number) {
    setAmount(String(value));
  }

  function handleRecord() {
    if (!selectedMember || amount === '0') return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const record: GivingRecord = {
      id: crypto.randomUUID(),
      memberId: selectedMember.id,
      memberName: `${selectedMember.firstName} ${selectedMember.lastName}`,
      amount: numAmount,
      category: selectedCategory,
    };
    setRecords(prev => [...prev, record]);
    setAmount('0');
    setSelectedMember(null);
    try { navigator.vibrate?.(50); } catch {/* noop */}
  }

  function handleRemoveRecord(id: string) {
    const removed = records.find(r => r.id === id);
    setRecords(prev => prev.filter(r => r.id !== id));
    if (removed) {
      toast('Record removed.', 'warning', {
        undoLabel: 'Undo',
        onUndo: () => setRecords(prev => [...prev, removed]),
      });
    }
  }

  async function handleConfirmBatch() {
    setConfirming(true);
    try {
      await postChurchMutation(churchId!, 'giving_batch:create', {
        id: batchId,
        churchId,
        date: new Date().toISOString().split('T')[0],
        status: 'open',
        counter1Id: 'current-user',
        records: records.map(r => ({
          id: r.id,
          batchId,
          memberId: r.memberId,
          memberName: r.memberName,
          type: r.category === 'tithe' ? 'tithe' : 'offering',
          amount: r.amount,
          category: r.category,
        })),
      });
      setRecords([]);
      setBatchOpen(false);
      toast('Batch confirmed!', 'success');
      try { navigator.vibrate?.(100); } catch {/* noop */}
    } catch {
      toast('Failed to confirm batch. Please try again.', 'error');
    } finally {
      setConfirming(false);
    }
  }

  const { data: batches } = useQuery({
    queryKey: ['batches', churchId],
    queryFn: async () => {
      const state = await fetchChurchState(churchId!);
      const givingBatches = (state.givingBatches as Record<string, Record<string, unknown>>) ?? {};
      return Object.values(givingBatches);
    },
    enabled: !!churchId,
    refetchInterval: 5000,
  });

  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
  const openBatches = (batches ?? []).filter((b: Record<string, unknown>) => b.status !== 'committed');

  if (!batchOpen) {
    return (
      <RequireAuth allowedRoles={['counter']}>
      <div className="min-h-screen bg-neutral-50 px-4 py-6 dark:bg-neutral-950">
        <div className="mx-auto max-w-md space-y-6">
          {openBatches.length > 0 && (
            <Card>
              <CardContent className="space-y-3 p-4">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Active Batches</h2>
                {openBatches.map((b: Record<string, unknown>) => (
                  <div
                    key={b.id as string}
                    className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-3 hover:bg-neutral-100 cursor-pointer dark:bg-neutral-800 dark:hover:bg-neutral-700"
                    onClick={() => navigate({ to: `/counting-room/batch/${b.id}` })}
                    onKeyDown={(e) => e.key === 'Enter' && navigate({ to: `/counting-room/batch/${b.id}` })}
                    role="button"
                    tabIndex={0}
                  >
                      <div>
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{b.date as string}</span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{b.status as string}</p>
                      </div>
                      <span className="text-sm tabular-nums text-neutral-900 dark:text-neutral-100">
                        ${((b.counter1Records as Array<Record<string,unknown>>)?.reduce((s, r) => s + (r.amount as number ?? 0), 0) ?? 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="py-12 text-center">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Counting Room</h1>
              <p className="mt-2 text-neutral-500 dark:text-neutral-400">Open a new batch to record today's giving.</p>
              <Button className="mt-6" onClick={() => setBatchOpen(true)} size="lg">
                Open New Batch
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </RequireAuth>
    );
  }

  if (membersLoading) {
    return (
      <RequireAuth allowedRoles={['counter']}>
      <div className="min-h-screen bg-neutral-50 px-4 py-6 dark:bg-neutral-950">
        <div className="mx-auto max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <SkeletonLine width="w-40" />
            <SkeletonLine width="w-24" />
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth allowedRoles={['counter']}>
    <div className="min-h-screen bg-neutral-50 px-4 py-6 dark:bg-neutral-950">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">New Batch</h1>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{new Date().toLocaleDateString()}</span>
        </div>

        <div className="rounded-lg bg-white border border-neutral-200 p-4 dark:bg-neutral-900 dark:border-neutral-700">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">Batch Total</div>
          <div className="text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">${totalAmount.toFixed(2)}</div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">{records.length} record{records.length !== 1 ? 's' : ''}</div>
        </div>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="text-center text-3xl font-bold tabular-nums text-neutral-900 py-4 dark:text-neutral-100">
              ${amount}
            </div>

            <div className="flex gap-2 flex-wrap">
              {quickAmounts.map(v => (
                <Button key={v} variant="secondary" size="sm" onClick={() => handleQuickAmount(v)}>
                  ${v}
                </Button>
              ))}
            </div>

            <NumericKeypad
              onNumber={handleNumber}
              onDecimal={handleDecimal}
              onBackspace={handleBackspace}
              onEnter={handleRecord}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-4">
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredMembers.map(m => (
                <button
                  key={m.id}
                  type="button"
                  className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:text-neutral-200 ${selectedMember?.id === m.id ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : ''}`}
                  onClick={() => setSelectedMember(m)}
                >
                  {m.firstName} {m.lastName}
                </button>
              ))}
              {filteredMembers.length === 0 && (
                <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-2">No members found</p>
              )}
            </div>
            {selectedMember && (
              <div className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                Selected: {selectedMember.firstName} {selectedMember.lastName}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedCategory === c.value ? 'bg-brand-600 text-white dark:bg-brand-500' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'}`}
                  onClick={() => setSelectedCategory(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {records.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Records</h2>
              {records.map(record => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800"
                  style={{ overflowX: 'auto' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveRecord(record.id)}
                      className="mr-2 text-neutral-400 hover:text-error dark:text-neutral-500 dark:hover:text-red-400"
                    >
                      ×
                    </button>
                    <span className="text-sm truncate text-neutral-900 dark:text-neutral-100">{record.memberName}</span>
                    <Badge>{record.category}</Badge>
                  </div>
                  <span className="text-sm font-medium tabular-nums ml-2 shrink-0 text-neutral-900 dark:text-neutral-100">${record.amount.toFixed(2)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {records.length > 0 && (
          <Button className="w-full" size="lg" onClick={handleConfirmBatch} isLoading={confirming}>
            {confirming ? 'Confirming...' : `Confirm Batch — ${records.length} record${records.length !== 1 ? 's' : ''} · $${totalAmount.toFixed(2)}`}
          </Button>
        )}
      </div>
    </div>
    </RequireAuth>
  );
}
