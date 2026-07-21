import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchOrgs, createOrg } from "../lib/api";

const VALID_LEVELS = ["division", "union", "conference", "church", "company"];

export default function Orgs() {
  const {
    data: orgs,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["orgs"],
    queryFn: fetchOrgs,
  });
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("church");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await createOrg({ name, level });
      setName("");
      setLevel("church");
      setShowForm(false);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create org");
    } finally {
      setCreating(false);
    }
  }

  if (isLoading) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Organizations</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800"
        >
          {showForm ? "Cancel" : "Add Org"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white p-6 rounded-lg shadow mb-6 space-y-4"
        >
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {VALID_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
      )}

      {orgs && orgs.length === 0 && (
        <p className="text-gray-500">No organizations yet.</p>
      )}

      {orgs && orgs.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  Level
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  Parent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orgs.map(
                (org: {
                  id: string;
                  name: string;
                  level: string;
                  parentId: string | null;
                }) => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {org.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-indigo-100 text-indigo-800">
                        {org.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {org.parentId ?? "-"}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
