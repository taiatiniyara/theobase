import { useState } from "react";
import { reconciliationApi, type TitheEntry, type TitheReportEntry } from "../lib/api";

export default function ReconciliationPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [view, setView] = useState<"tithe" | "report" | "bank">("tithe");
  const [titheData, setTitheData] = useState<TitheEntry[]>([]);
  const [reportData, setReportData] = useState<TitheReportEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiveForm, setReceiveForm] = useState<{
    churchId: number | null;
    receivedAmount: string;
    note: string;
  }>({ churchId: null, receivedAmount: "", note: "" });

  // Bank balance form
  const [bankForm, setBankForm] = useState({
    churchId: "",
    bankBalance: "",
    note: "",
  });

  const loadTithe = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reconciliationApi.getConferenceTithe(year, month);
      setTitheData(res.tithe);
    } catch {
      setError("Failed to load tithe data");
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reconciliationApi.getTitheReport(year, month);
      setReportData(res.report);
    } catch {
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (churchId: number) => {
    const amount =
      receiveForm.churchId === churchId ? Number(receiveForm.receivedAmount) : undefined;
    setLoading(true);
    setError(null);
    try {
      await reconciliationApi.receiveTithe({
        churchId,
        year,
        month,
        receivedAmount: amount || undefined,
        note: receiveForm.churchId === churchId ? receiveForm.note || undefined : undefined,
      });
      setReceiveForm({ churchId: null, receivedAmount: "", note: "" });
      await loadTithe();
    } catch {
      setError("Failed to reconcile");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordBank = async () => {
    setLoading(true);
    setError(null);
    try {
      await reconciliationApi.recordChurchBalance({
        churchId: Number(bankForm.churchId),
        year,
        month,
        bankBalance: Number(bankForm.bankBalance),
        note: bankForm.note || undefined,
      });
      setBankForm({ churchId: "", bankBalance: "", note: "" });
      setError("Bank balance recorded successfully");
    } catch {
      setError("Failed to record bank balance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Reconciliation</h2>
      <p className="mt-1 text-sm text-gray-500">
        Conference tithe reconciliation and church bank balance tracking.
      </p>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setView("tithe")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            view === "tithe"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Tithe Forwarded
        </button>
        <button
          onClick={() => {
            setView("report");
            loadReport();
          }}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            view === "report"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Reconciliation Report
        </button>
        <button
          onClick={() => setView("bank")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            view === "bank"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Bank Balance
        </button>
      </div>

      <div className="mt-4 flex items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-xs font-medium text-gray-600">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-1 block w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="mt-1 block w-28 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2024, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            if (view === "tithe") loadTithe();
            else loadReport();
          }}
          disabled={loading}
          className="rounded-md bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

      {error && (
        <p
          className={`mt-3 text-sm ${error.includes("successfully") ? "text-green-600" : "text-red-600"}`}
        >
          {error}
        </p>
      )}

      {view === "tithe" && titheData.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3">Church</th>
                <th className="px-4 py-3 text-right">Forwarded</th>
                <th className="px-4 py-3 text-right">Received</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {titheData.map((t) => (
                <tr key={t.churchId}>
                  <td className="px-4 py-3 font-medium text-gray-800">{t.churchName}</td>
                  <td className="px-4 py-3 text-right">${t.forwardedAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">${t.receivedAmount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.status === "received"
                          ? "bg-green-100 text-green-700"
                          : t.status === "discrepancy"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {t.status !== "received" ? (
                      <div className="flex items-center gap-2">
                        {receiveForm.churchId === t.churchId ? (
                          <>
                            <input
                              type="number"
                              placeholder="Amount"
                              value={receiveForm.receivedAmount}
                              onChange={(e) =>
                                setReceiveForm((f) => ({ ...f, receivedAmount: e.target.value }))
                              }
                              className="w-24 rounded border border-gray-300 px-2 py-1 text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Note"
                              value={receiveForm.note}
                              onChange={(e) =>
                                setReceiveForm((f) => ({ ...f, note: e.target.value }))
                              }
                              className="w-32 rounded border border-gray-300 px-2 py-1 text-xs"
                            />
                            <button
                              onClick={() => handleReceive(t.churchId)}
                              className="rounded bg-orange-500 px-2 py-1 text-xs text-white hover:bg-orange-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={() =>
                                setReceiveForm({ churchId: null, receivedAmount: "", note: "" })
                              }
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              setReceiveForm({
                                churchId: t.churchId,
                                receivedAmount: String(t.forwardedAmount),
                                note: "",
                              })
                            }
                            className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                          >
                            Mark Received
                          </button>
                        )}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "report" && reportData.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3">Church</th>
                <th className="px-4 py-3 text-right">Forwarded</th>
                <th className="px-4 py-3 text-right">Received</th>
                <th className="px-4 py-3 text-right">Difference</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportData.map((r) => (
                <tr key={r.churchId}>
                  <td className="px-4 py-3 font-medium text-gray-800">{r.churchName}</td>
                  <td className="px-4 py-3 text-right">${r.forwarded.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">${r.received.toLocaleString()}</td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      r.difference === 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {r.difference === 0 ? "$0" : `$${r.difference.toLocaleString()}`}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.status === "received"
                          ? "bg-green-100 text-green-700"
                          : r.status === "discrepancy"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "bank" && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 max-w-md">
          <h3 className="text-md font-semibold text-gray-800">Record Monthly Bank Balance</h3>
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600">Church ID</label>
              <input
                type="number"
                value={bankForm.churchId}
                onChange={(e) => setBankForm((f) => ({ ...f, churchId: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Bank Balance</label>
              <input
                type="number"
                value={bankForm.bankBalance}
                onChange={(e) => setBankForm((f) => ({ ...f, bankBalance: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Note (optional)</label>
              <input
                type="text"
                value={bankForm.note}
                onChange={(e) => setBankForm((f) => ({ ...f, note: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <button
              onClick={handleRecordBank}
              disabled={loading || !bankForm.churchId || !bankForm.bankBalance}
              className="rounded-md bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? "Recording..." : "Record Balance"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
