import { useState, useEffect } from "react";
import { billingApi, type BillingStatus } from "../lib/api";

export default function BillingPage() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    billingApi
      .getStatus()
      .then(setStatus)
      .catch((err: { error?: string }) => setError(err.error || "Failed to load billing status"))
      .finally(() => setLoading(false));
  }, []);

  async function handleManageBilling() {
    try {
      const { url } = await billingApi.createCheckout();
      window.location.href = url;
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e.error || "Failed to open billing portal");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900">Billing</h2>
        <p className="mt-4 text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  const sub = status?.subscription;
  const statusLabel =
    sub?.status === "active" ? "Active" : sub?.status === "trialing" ? "Trial" : "Past Due";
  const statusColor =
    sub?.status === "active"
      ? "bg-green-100 text-green-800"
      : sub?.status === "trialing"
        ? "bg-blue-100 text-blue-800"
        : "bg-red-100 text-red-800";

  function daysRemaining(trialEndsAt: string): number {
    const end = new Date(trialEndsAt);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900">Billing</h2>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-6 space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
          <p className="mt-1 text-sm text-gray-500">Per-church metered billing</p>

          {sub && (
            <div className="mt-4 grid gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-500">Status</span>
                <span
                  className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}
                >
                  {statusLabel}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-500">Churches</span>
                <p className="mt-0.5 text-gray-900">{sub.churchCount}</p>
              </div>
              {sub.status === "trialing" && sub.trialEndsAt && (
                <div>
                  <span className="font-medium text-gray-500">Trial Ends</span>
                  <p className="mt-0.5 text-gray-900">
                    {new Date(sub.trialEndsAt).toLocaleDateString()} (
                    {daysRemaining(sub.trialEndsAt)} days remaining)
                  </p>
                </div>
              )}
              {sub.status === "past_due" && (
                <div className="mt-2 rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-700">
                    Your subscription is past due. Update your payment method to continue using
                    Theobase.
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleManageBilling}
            className="mt-6 rounded-md bg-[#F97316] px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
          >
            Manage Billing
          </button>
        </div>

        {status?.invoices && status.invoices.length > 0 && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-gray-900">Invoice History</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 font-medium">Period</th>
                    <th className="py-2 font-medium">Churches</th>
                    <th className="py-2 font-medium">Amount</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {status.invoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-gray-100">
                      <td className="py-2 text-gray-900">
                        {inv.periodStart} – {inv.periodEnd}
                      </td>
                      <td className="py-2 text-gray-900">{inv.churchCount}</td>
                      <td className="py-2 text-gray-900">${inv.amount.toFixed(2)}</td>
                      <td className="py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            inv.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : inv.status === "overdue"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
