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

export const Route = createFileRoute('/members')({
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
        header: 'Name',
        sortingFn: 'alphanumeric',
        cell: ({ row }) => {
          const initials = `${row.original.firstName?.[0] ?? ''}${row.original.lastName?.[0] ?? ''}`;
          return (
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-neutral-900">
                {row.original.firstName} {row.original.lastName}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ getValue }) => {
          const value = getValue<string | null>();
          return value ? (
            <span className="text-neutral-600">{value}</span>
          ) : (
            <span className="text-neutral-400">—</span>
          );
        },
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ getValue }) => {
          const value = getValue<string | null>();
          return value || <span className="text-neutral-400">—</span>;
        },
      },
      {
        accessorKey: 'membershipStatus',
        header: 'Status',
        filterFn: 'equals',
        cell: ({ getValue }) => {
          const value = getValue<string>();
          return (
            <Badge variant={STATUS_BADGE_VARIANT[value] ?? 'default'}>
              {value}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'dateOfBirth',
        header: 'DOB',
        cell: ({ getValue }) => {
          const value = getValue<string | null>();
          return value || <span className="text-neutral-400">—</span>;
        },
      },
      {
        accessorKey: 'householdId',
        header: 'Household',
        cell: ({ getValue }) => {
          const value = getValue<string | null>();
          return value || <span className="text-neutral-400">—</span>;
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Link
              to="/members/$memberId/edit"
              params={{ memberId: row.original.id }}
            >
              <Button variant="ghost" size="sm">
                {t('member.edit')}
              </Button>
            </Link>
          </div>
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
      <div className="min-h-screen bg-neutral-50 px-4 py-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
            <div className="flex gap-3">
              <div className="h-12 w-28 animate-pulse rounded-md bg-neutral-200" />
              <div className="h-12 w-28 animate-pulse rounded-md bg-neutral-200" />
            </div>
          </div>
          <div className="h-12 w-full animate-pulse rounded-md bg-neutral-200" />
          <div className="rounded-lg border border-neutral-200 bg-white">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded bg-neutral-200"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="text-xl font-semibold text-neutral-900">
                {t('member.noMembers')}
            </h2>
            <p className="mt-2 text-neutral-500">              {t('member.noMembersHint')}</p>
            <Link to="/members/add" className="mt-6">
              <Button>                    {t('member.addMember')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">
              {t('member.directory')}
          </h1>
          <div className="flex gap-3">
            <Link to="/members/add">
              <Button>                    {t('member.addMember')}</Button>
            </Link>
            <Link to="/church/import">
              <Button variant="secondary">                  {t('member.uploadCsv')}</Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Search members..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select
            value={
              (table.getColumn('membershipStatus')?.getFilterValue() as string) ?? ''
            }
            onValueChange={(value) =>
              table.getColumn('membershipStatus')?.setFilterValue(value || undefined)
            }
          >
            <SelectTrigger className="sm:max-w-[180px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="baptised">baptised</SelectItem>
              <SelectItem value="profession">profession</SelectItem>
              <SelectItem value="transfer-in">transfer-in</SelectItem>
              <SelectItem value="transfer-out">transfer-out</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="hidden md:block rounded-lg border border-neutral-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-medium text-neutral-500 border-b border-neutral-200"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
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
            <div
              key={row.id}
              className="rounded-lg border border-neutral-200 bg-white p-4 space-y-2"
            >
              <div className="flex items-center gap-3">
                <Avatar size="sm">
                  <AvatarFallback>
                    {row.original.firstName?.[0] ?? ''}
                    {row.original.lastName?.[0] ?? ''}
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
              <div className="flex items-center justify-between text-sm">
                <Badge
                  variant={
                    STATUS_BADGE_VARIANT[row.original.membershipStatus] ?? 'default'
                  }
                >
                  {row.original.membershipStatus}
                </Badge>
                <Link
                  to="/members/$memberId/edit"
                  params={{ memberId: row.original.id }}
                >
                  <Button variant="ghost" size="sm">
                    {t('member.edit')}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
