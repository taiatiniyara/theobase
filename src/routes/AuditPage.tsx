import { useState, useEffect, useCallback } from "react";
import { auditApi, type AuditLogResponse } from "../lib/api";

const ENTITY_TYPES = [
  { value: "", label: "All Types" },
  { value: "member", label: "Member" },
  { value: "household", label: "Household" },
  { value: "position", label: "Position" },
  { value: "member_position", label: "Member Position" },
  { value: "transfer", label: "Transfer" },
  { value: "transaction", label: "Transaction" },
  { value: "offering_batch", label: "Offering Batch" },
  { value: "fund", label: "Fund" },
  { value: "expense_category", label: "Expense Category" },
  { value: "budget", label: "Budget" },
  { value: "user", label: "User" },
  { value: "conference", label: "Conference" },
  { value: "district", label: "District" },
  { value: "church", label: "Church" },
];

const ACTIONS = [
  { value: "", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "remove", label: "Remove" },
  { value: "initiate", label: "Initiate" },
  { value: "approve", label: "Approve" },
  { value: "accept", label: "Accept" },
  { value: "reject", label: "Reject" },
  { value: "assign", label: "Assign" },
  { value: "confirm_1", label: "Confirm (1st)" },
  { value: "confirm_2", label: "Confirm (2nd)" },
  { value: "reset_password", label: "Reset Password" },
];

export default function AuditPage() {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await auditApi.getLog({
        entity_type: entityType || undefined,
        action: action || undefined,
        page,
        limit: 25,
      });
      setData(result);
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e.error || "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [page, entityType, action]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleFilter() {
    setPage(1);
    fetchData();
  }

  function handleExport(_format: "csv") {
    if (!data?.entries.length) return;
    setExporting(true);
    const headers = [
      "ID",
      "Timestamp",
      "Actor",
      "Action",
      "Entity Type",
      "Entity ID",
      "Module",
      "Prev State",
      "New State",
      "Device Info",
    ];
    const rows = data.entries.map((e) => [
      String(e.id),
      e.timestamp,
      e.actor_email ?? String(e.actor_id ?? ""),
      e.action,
      e.entity_type,
      String(e.entity_id),
      e.module,
      (e.prev_state ?? "").replace(/"/g, '""'),
      (e.new_state ?? "").replace(/"/g, '""'),
      (e.device_info ?? "").replace(/"/g, '""'),
    ]);
    const csv =
      headers.join(",") + "\n" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  function formatJson(json: string | null): string {
    if (!json) return "N/A";
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
        <button
          onClick={() => handleExport("csv")}
          disabled={exporting || !data?.entries.length}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <select
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          {ENTITY_TYPES.map((et) => (
            <option key={et.value} value={et.value}>
              {et.label}
            </option>
          ))}
        </select>
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          {ACTIONS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleFilter}
          className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
        >
          Filter
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
            <tr>
              <th className="px-3 py-3">Time</th>
              <th className="px-3 py-3">Actor</th>
              <th className="px-3 py-3">Action</th>
              <th className="px-3 py-3">Entity</th>
              <th className="px-3 py-3">Entity ID</th>
              <th className="px-3 py-3">Module</th>
              <th className="px-3 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : data?.entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  No audit entries found
                </td>
              </tr>
            ) : (
              data?.entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-700">
                    {entry.actor_email ?? `User #${entry.actor_id}`}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        entry.action === "create"
                          ? "bg-green-100 text-green-700"
                          : entry.action === "update"
                            ? "bg-blue-100 text-blue-700"
                            : entry.action === "remove" || entry.action === "reject"
                              ? "bg-red-100 text-red-700"
                              : entry.action.startsWith("confirm")
                                ? "bg-purple-100 text-purple-700"
                                : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {entry.action}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-700">
                    {entry.entity_type}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                    #{entry.entity_id}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                    {entry.module}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                      className="text-xs font-medium text-brand hover:text-orange-700"
                    >
                      {expandedEntry === entry.id ? "Hide" : "View"} diff
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {expandedEntry !== null &&
        data?.entries &&
        (() => {
          const entry = data.entries.find((e) => e.id === expandedEntry);
          if (!entry) return null;
          return (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-white p-4 shadow">
                <h4 className="mb-2 text-sm font-medium text-gray-500">Previous State</h4>
                <pre className="max-h-64 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-700">
                  {formatJson(entry.prev_state)}
                </pre>
              </div>
              <div className="rounded-lg bg-white p-4 shadow">
                <h4 className="mb-2 text-sm font-medium text-gray-500">New State</h4>
                <pre className="max-h-64 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-700">
                  {formatJson(entry.new_state)}
                </pre>
              </div>
              {entry.device_info && (
                <div className="rounded-lg bg-white p-4 shadow md:col-span-2">
                  <h4 className="mb-1 text-sm font-medium text-gray-500">Device Info</h4>
                  <p className="text-xs text-gray-600">{entry.device_info}</p>
                </div>
              )}
            </div>
          );
        })()}

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Page {data.page} of {data.totalPages} ({data.total} total)
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded border px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              className="rounded border px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
