import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { userApi } from "../lib/api";

interface UserRecord {
  id: number;
  email: string;
  role: string;
  conference_id?: number;
}

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [tab, setTab] = useState<"list" | "invite" | "bulk">("list");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const conferenceId = user?.conference?.id;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userApi.getUsers(conferenceId);
      setUsers(data.users);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await userApi.inviteUser({
        email: form.get("email") as string,
        role: form.get("role") as string,
        conferenceId,
      });
      setMessage("User invited");
      (e.target as HTMLFormElement).reset();
      loadUsers();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed";
      setMessage(msg);
    }
  }

  async function handleBulkInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!conferenceId) return;
    const form = new FormData(e.currentTarget);
    const csv = form.get("csv") as string;
    try {
      const result = await userApi.bulkInvite(conferenceId, csv);
      setMessage(`Invited ${(result as { created: unknown[] }).created.length} users`);
      loadUsers();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed";
      setMessage(msg);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
      {message && (
        <div className="mt-4 rounded bg-blue-50 p-3 text-sm text-blue-600">{message}</div>
      )}

      <div className="mt-4 flex space-x-1 border-b border-gray-200">
        {(["list", "invite", "bulk"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t
                ? "border-b-2 border-orange-500 text-orange-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "list" ? "Users" : t === "invite" ? "Invite" : "Bulk Import"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "list" && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-gray-900">Users ({users.length})</h3>
            {loading ? (
              <p className="mt-2 text-gray-500">Loading...</p>
            ) : users.length === 0 ? (
              <p className="mt-2 text-gray-500">No users yet.</p>
            ) : (
              <div className="mt-4 divide-y">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2">
                    <div>
                      <span className="font-medium text-gray-900">{u.email}</span>
                    </div>
                    <span className="text-sm capitalize text-gray-500">{u.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "invite" && (
          <div className="max-w-lg rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-gray-900">Invite User</h3>
            <form onSubmit={handleInvite} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  name="role"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="president">Conference President</option>
                  <option value="secretary">Conference Secretary</option>
                  <option value="treasurer">Conference Treasurer</option>
                  <option value="auditor">Conference Auditor</option>
                  <option value="pastor">District Pastor</option>
                  <option value="member">Church Member</option>
                </select>
              </div>
              <button
                type="submit"
                className="rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
              >
                Send Invitation
              </button>
            </form>
          </div>
        )}

        {tab === "bulk" && (
          <div className="max-w-lg rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-gray-900">Bulk Invite Users</h3>
            <p className="mt-1 text-sm text-gray-500">
              Paste CSV with columns: email, role, church
            </p>
            <form onSubmit={handleBulkInvite} className="mt-4 space-y-4">
              <textarea
                name="csv"
                required
                rows={8}
                placeholder="email,role,church&#10;treasurer@example.com,treasurer,Central SDA Church&#10;clerk@example.com,secretary,Central SDA Church"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <button
                type="submit"
                className="rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
              >
                Import Users
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
