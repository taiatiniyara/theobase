import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../lib/auth-store';
import { useMembers } from '../../lib/queries';
import { postChurchMutation } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { NumericKeypad } from '../../components/features/numeric-keypad';
import { Snackbar } from '../../components/features/snackbar';
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

export const Route = createFileRoute('/counting-room')({
  component: CountingRoomPage,
});

function CountingRoomPage() {
  const { churchId } = useAuth();
  const { data: members = [] } = useMembers(churchId!);
  const [amount, setAmount] = useState('0');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('tithe');
  const [records, setRecords] = useState<GivingRecord[]>([]);
  const [batchOpen, setBatchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState<{ message: string; onUndo?: () => void } | null>(null);
  const [batchId] = useState(() => crypto.randomUUID());

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
      setSnackbar({
        message: 'Record removed.',
        onUndo: () => setRecords(prev => [...prev, removed]),
      });
    }
  }

  async function handleConfirmBatch() {
    for (const record of records) {
      await postChurchMutation(churchId!, 'giving_record:create', {
        id: record.id,
        batchId,
        memberId: record.memberId,
        type: 'offering',
        amount: record.amount,
        category: record.category,
      });
    }
    await postChurchMutation(churchId!, 'giving_batch:create', {
      id: batchId,
      churchId,
      date: new Date().toISOString().split('T')[0],
      status: 'open',
    });
    setRecords([]);
    setBatchOpen(false);
    setSnackbar({ message: 'Batch confirmed!' });
    try { navigator.vibrate?.(100); } catch {/* noop */}
  }

  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);

  if (!batchOpen) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-6">
        <div className="mx-auto max-w-md space-y-6">
          {snackbar && <Snackbar {...snackbar} onDismiss={() => setSnackbar(null)} />}
          <Card>
            <CardContent className="py-12 text-center">
              <h1 className="text-2xl font-bold text-neutral-900">Counting Room</h1>
              <p className="mt-2 text-neutral-500">Open a new batch to record today's giving.</p>
              <Button className="mt-6" onClick={() => setBatchOpen(true)} size="lg">
                Open New Batch
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-6">
      <div className="mx-auto max-w-md space-y-6">
        {snackbar && <Snackbar {...snackbar} onDismiss={() => setSnackbar(null)} />}

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-900">New Batch</h1>
          <span className="text-sm text-neutral-500">{new Date().toLocaleDateString()}</span>
        </div>

        {/* Batch total */}
        <div className="rounded-lg bg-white border border-neutral-200 p-4">
          <div className="text-sm text-neutral-500">Batch Total</div>
          <div className="text-2xl font-bold tabular-nums text-neutral-900">${totalAmount.toFixed(2)}</div>
          <div className="text-sm text-neutral-500">{records.length} record{records.length !== 1 ? 's' : ''}</div>
        </div>

        {/* Amount display + keypad */}
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="text-center text-3xl font-bold tabular-nums text-neutral-900 py-4">
              ${amount}
            </div>

            {/* Quick denomination buttons */}
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

        {/* Member selection */}
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
                  className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-neutral-50 ${selectedMember?.id === m.id ? 'bg-brand-50 text-brand-700' : ''}`}
                  onClick={() => setSelectedMember(m)}
                >
                  {m.firstName} {m.lastName}
                </button>
              ))}
              {filteredMembers.length === 0 && (
                <p className="text-sm text-neutral-400 text-center py-2">No members found</p>
              )}
            </div>
            {selectedMember && (
              <div className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-700">
                Selected: {selectedMember.firstName} {selectedMember.lastName}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category selection */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedCategory === c.value ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
                  onClick={() => setSelectedCategory(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Records list */}
        {records.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <h2 className="text-lg font-semibold text-neutral-900">Records</h2>
              {records.map(record => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2"
                  style={{ overflowX: 'auto' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveRecord(record.id)}
                      className="mr-2 text-neutral-400 hover:text-error"
                    >
                      ×
                    </button>
                    <span className="text-sm truncate">{record.memberName}</span>
                    <Badge>{record.category}</Badge>
                  </div>
                  <span className="text-sm font-medium tabular-nums ml-2 shrink-0">${record.amount.toFixed(2)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Confirm batch */}
        {records.length > 0 && (
          <Button className="w-full" size="lg" onClick={handleConfirmBatch}>
            Confirm Batch — {records.length} record{records.length !== 1 ? 's' : ''} · ${totalAmount.toFixed(2)}
          </Button>
        )}
      </div>
    </div>
  );
}
