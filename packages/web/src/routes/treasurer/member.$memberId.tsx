import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth-store';
import { RequireAuth } from '../../lib/auth-guard';
import { fetchChurchState } from '../../lib/api';
import { useMembers } from '../../lib/queries';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';

interface GivingRecord {
  id: string;
  batchId: string;
  memberId: string;
  type: string;
  amount: number;
  category: string;
  paymentMethod: string;
}

export const Route = createFileRoute('/treasurer/member/$memberId')({
  component: MemberGivingHistoryPage,
});

function MemberGivingHistoryPage() {
  const { memberId } = Route.useParams();
  const { churchId } = useAuth();
  const { data: members = [] } = useMembers(churchId!);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const { data: state } = useQuery({
    queryKey: ['church-state', churchId],
    queryFn: () => fetchChurchState(churchId!),
    enabled: !!churchId,
  });

  const member = members.find(m => m.id === memberId);
  const allRecords = Object.values((state?.givingRecords as Record<string, Record<string, unknown>>) ?? {}) as unknown as GivingRecord[];
  const memberRecords = allRecords.filter(r => r.memberId === memberId);

  const titheTotal = memberRecords.filter(r => r.type === 'tithe').reduce((s, r) => s + r.amount, 0);
  const offeringTotal = memberRecords.filter(r => r.type === 'offering').reduce((s, r) => s + r.amount, 0);
  const grandTotal = memberRecords.reduce((s, r) => s + r.amount, 0);

  const columns = useMemo<ColumnDef<GivingRecord>[]>(() => [
    { accessorKey: 'batchId', header: 'Batch', cell: ({ getValue }) => <span className="text-xs font-mono">{getValue<string>().slice(0, 8)}</span> },
    { accessorKey: 'type', header: 'Type', cell: ({ getValue }) => <Badge variant={getValue<string>() === 'tithe' ? 'success' : 'default'}>{getValue<string>()}</Badge> },
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'amount', header: 'Amount', cell: ({ getValue }) => <span className="tabular-nums font-medium">${getValue<number>().toFixed(2)}</span> },
    { accessorKey: 'paymentMethod', header: 'Method' },
  ], []);

  const table = useReactTable({
    data: memberRecords,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
  });

  if (!member) {
    return (
      <RequireAuth allowedRoles={['treasurer']}>
      <div className="px-4 py-6 max-w-3xl mx-auto">
        <div className="mx-auto max-w-3xl text-center py-24">
          <p className="text-neutral-600">Member not found.</p>
        </div>
      </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth allowedRoles={['treasurer']}>
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <div className="mx-auto max-w-3xl space-y-6">
        <button type="button" onClick={() => window.history.back()} className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {member.firstName} {member.lastName} — Giving History
        </h1>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm text-neutral-500">Tithe</div>
              <div className="text-xl font-bold tabular-nums">${titheTotal.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm text-neutral-500">Offerings</div>
              <div className="text-xl font-bold tabular-nums">${offeringTotal.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm text-neutral-500">Total</div>
              <div className="text-xl font-bold tabular-nums">${grandTotal.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Input placeholder="Search records..." value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} />

        <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th key={h.id} className="px-4 py-3 text-left text-sm font-medium text-neutral-500 border-b border-neutral-200 cursor-pointer" onClick={h.column.getToggleSortingHandler()}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {memberRecords.length === 0 && (
          <p className="text-center text-neutral-500 py-8">No giving records found for this member.</p>
        )}
      </div>
    </div>
    </RequireAuth>
  );
}
