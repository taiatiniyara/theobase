import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type ColumnDef,
} from '@tanstack/react-table';
import { useAuth } from '../../lib/auth-store';
import { RequireAuth } from '../../lib/auth-guard';
import { useMembers } from '../../lib/queries';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import type { Member } from '@theobase/shared';

const STATUS_BADGE_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  baptised: 'success',
  profession: 'default',
  'transfer-in': 'warning',
  'transfer-out': 'error',
};

export const Route = createFileRoute('/members/')({
  component: MemberDirectoryPage,
});

function MemberDirectoryPage() {
  const { t } = useTranslation();
  const { churchId } = useAuth();
  const { data: members = [], isLoading } = useMembers(churchId!);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = useMemo<ColumnDef<Member>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('member.firstName'),
        sortingFn: 'alphanumeric',
        cell: ({ row }) => {
          const initials = `${row.original.firstName?.[0] ?? ''}${row.original.lastName?.[0] ?? ''}`;
          return (
            <Link to="/members/$memberId" params={{ memberId: row.original.id }} className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-neutral-900">
                {row.original.firstName} {row.original.lastName}
              </span>
            </Link>
          );
        },
      },
      {
        accessorKey: 'membershipStatus',
        header: t('member.status'),
        filterFn: 'equals',
        cell: ({ getValue }) => (
          <Badge variant={STATUS_BADGE_VARIANT[getValue<string>()] ?? 'default'}>
            {getValue<string>()}
          </Badge>
        ),
      },
      {
        accessorKey: 'email',
        header: t('member.email'),
        cell: ({ getValue }) => getValue<string | null>() ?? <span className="text-neutral-400">—</span>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Link to="/members/$memberId/edit" params={{ memberId: row.original.id }}>
            <Button variant="ghost" size="sm">{t('member.edit')}</Button>
          </Link>
        ),
      },
    ],
    [t],
  );

  const table = useReactTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
  });

  if (isLoading) {
    return (
      <RequireAuth allowedRoles={['clerk', 'pastor', 'board-member']}>
      <div className="px-4 py-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded-md bg-neutral-200" />
          <div className="h-10 w-28 animate-pulse rounded-md bg-neutral-200" />
        </div>
        <div className="h-10 w-full animate-pulse rounded-md bg-neutral-200" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-neutral-200" />
        ))}
      </div>
      </RequireAuth>
    );
  }

  if (members.length === 0) {
    return (
      <RequireAuth allowedRoles={['clerk', 'pastor', 'board-member']}>
      <div className="px-4 py-6 max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h2 className="text-xl font-semibold text-neutral-900">
            {t('member.noMembers')}
          </h2>
          <p className="mt-2 text-sm text-neutral-500">{t('member.noMembersHint')}</p>
          <Link to="/members/add" className="mt-6">
            <Button>{t('member.addMember')}</Button>
          </Link>
        </div>
      </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth allowedRoles={['clerk', 'pastor', 'board-member']}>
    <div className="px-4 py-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">
          {t('member.directory')}
        </h1>
        <div className="flex gap-3">
          <Link to="/members/add">
            <Button>{t('member.addMember')}</Button>
          </Link>
          <Link to="/church/import">
            <Button variant="secondary">{t('member.uploadCsv')}</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder={t('member.search')}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          value={(table.getColumn('membershipStatus')?.getFilterValue() as string) ?? ''}
          onValueChange={(value) =>
            table.getColumn('membershipStatus')?.setFilterValue(value || undefined)
          }
        >
          <SelectTrigger className="sm:max-w-[180px]">
            <SelectValue placeholder={t('member.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('member.status')}</SelectItem>
            <SelectItem value="baptised">baptised</SelectItem>
            <SelectItem value="profession">profession</SelectItem>
            <SelectItem value="transfer-in">transfer-in</SelectItem>
            <SelectItem value="transfer-out">transfer-out</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="hidden md:block rounded-lg border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium text-neutral-500 border-b border-neutral-200 cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50:bg-neutral-750"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {table.getRowModel().rows.map((row) => (
          <Link
            key={row.id}
            to="/members/$memberId"
            params={{ memberId: row.original.id }}
            className="block rounded-lg border border-neutral-200 bg-white shadow-sm p-4 space-y-2"
          >
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarFallback>
                  {row.original.firstName?.[0] ?? ''}{row.original.lastName?.[0] ?? ''}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-neutral-900">
                  {row.original.firstName} {row.original.lastName}
                </div>
                <div className="text-sm text-neutral-500">
                  {row.original.email || '—'}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant={STATUS_BADGE_VARIANT[row.original.membershipStatus] ?? 'default'}>
                {row.original.membershipStatus}
              </Badge>
              <Button variant="ghost" size="sm">{t('member.edit')}</Button>
            </div>
          </Link>
        ))}
      </div>
    </div>
    </RequireAuth>
  );
}
