import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  fetchMembers,
  createMember,
  updateMember,
  type Member,
} from "../lib/api";

const VALID_STATUSES = [
  "active",
  "under-censure",
  "transferred-out",
  "transferred-in",
  "disfellowshipped",
  "apostasy",
  "missing",
  "renounced",
  "deceased",
] as const;

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  "under-censure": "bg-yellow-100 text-yellow-800",
  "transferred-out": "bg-blue-100 text-blue-800",
  "transferred-in": "bg-purple-100 text-purple-800",
  disfellowshipped: "bg-red-100 text-red-800",
  apostasy: "bg-red-100 text-red-800",
  missing: "bg-gray-100 text-gray-800",
  renounced: "bg-gray-100 text-gray-800",
  deceased: "bg-gray-100 text-gray-800",
};

const columnHelper = createColumnHelper<Member>();

export default function Members() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["members", statusFilter, search, page],
    queryFn: () =>
      fetchMembers("church-1", {
        status: statusFilter || undefined,
        search: search || undefined,
        page,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (d: { firstName: string; lastName: string }) =>
      createMember("church-1", d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setShowForm(false);
      setFormError("");
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateMember("church-1", id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }),
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor("lastName", { header: "Last Name" }),
      columnHelper.accessor("firstName", { header: "First Name" }),
      columnHelper.accessor("email", { header: "Email" }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => (
          <span
            className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${STATUS_COLORS[info.getValue()] ?? ""}`}
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("baptismDate", { header: "Baptism" }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <select
            value={row.original.status}
            onChange={(e) =>
              statusMutation.mutate({
                id: row.original.id,
                status: e.target.value,
              })
            }
            className="text-xs border border-gray-300 rounded px-1 py-0.5"
          >
            {VALID_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: data?.members ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Members</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800"
        >
          {showForm ? "Cancel" : "Add Member"}
        </button>
      </div>

      {showForm && (
        <AddMemberForm
          error={formError}
          onClose={() => {
            setShowForm(false);
            setFormError("");
          }}
          onSubmit={(d) => createMutation.mutate(d)}
          loading={createMutation.isPending}
        />
      )}

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded px-3 py-2 text-sm flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {VALID_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className="text-left px-4 py-3 text-sm font-medium text-gray-500"
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-sm text-gray-900"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && (
            <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
              <span>Total: {data.total} members</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={(data?.members.length ?? 0) < 50}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AddMemberForm({
  error,
  onClose,
  onSubmit,
  loading,
}: {
  error: string;
  onClose: () => void;
  onSubmit: (d: { firstName: string; lastName: string }) => void;
  loading: boolean;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ firstName, lastName });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow mb-6 space-y-4"
    >
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Member"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
