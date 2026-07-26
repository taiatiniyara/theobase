import { useState, useEffect } from "react";
import { adminApi, type AdminSubscription } from "../lib/api";

export default function AdminPage() {
  const [subs, setSubs] = useState<AdminSubscription[]>([]);
  const [health, setHealth] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [billingData, healthData] = await Promise.all([
          adminApi.getBilling(),
          adminApi.getHealth(),
        ]);
        setSubs(billingData.subscriptions);
        setHealth(healthData.database === "connected" ? "Connected" : "Disconnected");
      } catch (err: unknown) {
        const e = err as { error?: string };
        setError(e.error || "Failed to load admin data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <h2 className="text-2xl font-bold text-gray-900">System Administration</h2>
        <p className="mt-4 text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900">System Administration</h2>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-6 space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">System Health</h3>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`inline-block h-3 w-3 rounded-full ${
                health === "Connected" ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-gray-700">Database: {health}</span>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">Conference Subscriptions</h3>
          {subs.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No subscriptions found.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 font-medium">Conference</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 font-medium">Churches</th>
                    <th className="py-2 font-medium">Trial Ends</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map((sub) => (
                    <tr key={sub.id} className="border-t border-gray-100">
                      <td className="py-2 text-gray-900">#{sub.conferenceId}</td>
                      <td className="py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            sub.status === "active"
                              ? "bg-green-100 text-green-800"
                              : sub.status === "trialing"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-2 text-gray-900">{sub.churchCount}</td>
                      <td className="py-2 text-gray-500">
                        {sub.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
