import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../lib/auth";
import {
  financeApi,
  memberApi,
  type Fund,
  type ExpenseCategory,
  type Batch,
  type BatchDetail,
  type Transaction,
  type Budget,
  type MonthlyReport,
} from "../lib/api";

type Tab = "overview" | "batches" | "transactions" | "budgets" | "reports" | "setup";

export default function FinancePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState("");

  const conferenceId = user?.conference?.id;
  const churchId = user?.church?.id;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "batches", label: "Offering Batches" },
    { key: "transactions", label: "Transactions" },
    { key: "budgets", label: "Budgets" },
    { key: "reports", label: "Reports" },
    { key: "setup", label: "Setup" },
  ];

  if (!conferenceId) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Finance</h2>
        <p className="mt-4 text-gray-600">No conference assigned.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Finance</h2>
      {error && <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      <div className="mt-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "border-brand text-brand"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-6">
        {tab === "overview" && (
          <OverviewTab conferenceId={conferenceId} churchId={churchId} setError={setError} />
        )}
        {tab === "batches" && (
          <BatchesTab _conferenceId={conferenceId} churchId={churchId} setError={setError} />
        )}
        {tab === "transactions" && (
          <TransactionsTab conferenceId={conferenceId} churchId={churchId} setError={setError} />
        )}
        {tab === "budgets" && (
          <BudgetsTab conferenceId={conferenceId} churchId={churchId} setError={setError} />
        )}
        {tab === "reports" && (
          <ReportsTab _conferenceId={conferenceId} churchId={churchId} setError={setError} />
        )}
        {tab === "setup" && <SetupTab conferenceId={conferenceId} setError={setError} />}
      </div>
    </div>
  );
}

function OverviewTab({
  conferenceId,
  churchId,
  setError,
}: {
  conferenceId: number;
  churchId?: number;
  setError: (e: string) => void;
}) {
  const [funds, setFunds] = useState<Fund[]>([]);

  const load = useCallback(async () => {
    try {
      const fData = await financeApi.getFunds(conferenceId);
      setFunds(fData.funds);
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to load data"
      );
    }
  }, [conferenceId, setError]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900">Funds</h3>
        {funds.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            No funds configured. Go to Setup to add funds.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100">
            {funds.map((f) => (
              <li key={f.id} className="flex justify-between py-2">
                <div>
                  <span className="font-medium text-gray-900">{f.name}</span>
                  <span className="ml-2 text-xs text-gray-500 capitalize">
                    {f.type.replace("_", " ")}
                  </span>
                </div>
                <span className="text-sm text-gray-500 capitalize">{f.forwarding_rule}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
        <p className="mt-2 text-sm text-gray-500">
          Select a church and navigate to Batches to record offerings, or Reports for monthly
          summaries.
        </p>
      </div>
      {churchId && <BatchSummary churchId={churchId} setError={setError} />}
    </div>
  );
}

function BatchSummary({ churchId, setError }: { churchId: number; setError: (e: string) => void }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [recentBatches, setRecentBatches] = useState<Batch[]>([]);

  const load = useCallback(async () => {
    try {
      const bData = await financeApi.getBatches({ church_id: churchId });
      setRecentBatches(bData.batches.slice(0, 5));
      setPendingCount(bData.batches.filter((b) => b.status === "pending").length);
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to load batches"
      );
    }
  }, [churchId, setError]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="rounded-lg bg-white p-6 shadow lg:col-span-2">
      <h3 className="text-lg font-semibold text-gray-900">Recent Batches</h3>
      <p className="mt-1 text-sm text-gray-500">{pendingCount} pending confirmation</p>
      {recentBatches.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">No batches recorded yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 font-medium">Sabbath</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Entries</th>
                <th className="pb-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentBatches.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="py-2 text-gray-900">{b.sabbath_date}</td>
                  <td className="py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.status === "confirmed" || b.status === "synced"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-2 text-gray-700">{b.transaction_count}</td>
                  <td className="py-2 font-medium text-gray-900">
                    {b.total_amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getLatestSaturday(): string {
  const d = new Date();
  const dayOfWeek = d.getDay();
  const diff = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split("T")[0]!;
}

function BatchesTab({
  _conferenceId,
  churchId,
  setError,
}: {
  _conferenceId: number;
  churchId?: number;
  setError: (e: string) => void;
}) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchDetail | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [sabbathDate, setSabbathDate] = useState(getLatestSaturday());
  const [selectedChurchId, setSelectedChurchId] = useState(churchId ?? 0);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const bData = await financeApi.getBatches(
        selectedChurchId ? { church_id: selectedChurchId } : {}
      );
      setBatches(bData.batches);
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to load batches"
      );
    }
  }, [selectedChurchId, setError]);

  useEffect(() => {
    load();
  }, [load]);

  async function createBatch(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChurchId || !sabbathDate) return;
    setSubmitting(true);
    try {
      await financeApi.createBatch({ churchId: selectedChurchId, sabbathDate });
      setSabbathDate("");
      setShowCreate(false);
      await load();
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to create batch"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function viewBatch(id: number) {
    try {
      const detail = await financeApi.getBatch(id);
      setSelectedBatch(detail);
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to load batch"
      );
    }
  }

  if (selectedBatch) {
    return (
      <BatchDetailView
        batch={selectedBatch}
        onBack={() => {
          setSelectedBatch(null);
          load();
        }}
        onConfirm={async () => {
          try {
            const result = await financeApi.confirmBatch(selectedBatch.id);
            const detail = await financeApi.getBatch(selectedBatch.id);
            setSelectedBatch(detail);
            if (result.status === "confirmed") {
              await load();
            }
          } catch (err: unknown) {
            setError(
              err && typeof err === "object" && "error" in err
                ? String((err as { error: string }).error)
                : "Confirmation failed"
            );
          }
        }}
        setError={setError}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Church</label>
          <input
            type="number"
            value={selectedChurchId || ""}
            onChange={(e) => setSelectedChurchId(Number(e.target.value) || 0)}
            placeholder="Church ID"
            className="mt-1 w-28 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="mt-5 rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-orange-600"
        >
          New Batch
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={createBatch}
          className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <h4 className="mb-3 text-sm font-medium text-gray-900">Create Offering Batch</h4>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Sabbath Date</label>
              <input
                type="date"
                required
                value={sabbathDate}
                onChange={(e) => setSabbathDate(e.target.value)}
                className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Sabbath</th>
              <th className="px-4 py-3 font-medium">Church</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Entries</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Confirmed By</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {batches.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No batches found.
                </td>
              </tr>
            ) : (
              batches.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{b.sabbath_date}</td>
                  <td className="px-4 py-3 text-gray-700">{b.church_name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.status === "confirmed" || b.status === "synced"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{b.transaction_count}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {b.total_amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {b.confirmed_by_1_email && <div>1: {b.confirmed_by_1_email}</div>}
                    {b.confirmed_by_2_email && <div>2: {b.confirmed_by_2_email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => viewBatch(b.id)}
                      className="text-sm text-brand hover:text-orange-600"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BatchDetailView({
  batch,
  onBack,
  onConfirm,
  setError,
}: {
  batch: BatchDetail;
  onBack: () => void;
  onConfirm: () => void;
  setError: (e: string) => void;
}) {
  const [showAddTxn, setShowAddTxn] = useState(false);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [members, setMembers] = useState<{ id: number; full_name: string }[]>([]);
  const [txnFundId, setTxnFundId] = useState(0);
  const [txnAmount, setTxnAmount] = useState("");
  const [txnDesc, setTxnDesc] = useState("");
  const [txnEnvelope, setTxnEnvelope] = useState("");
  const [txnMemberId, setTxnMemberId] = useState(0);
  const [submittingTxn, setSubmittingTxn] = useState(false);

  useEffect(() => {
    financeApi
      .getFunds()
      .then((d) => setFunds(d.funds))
      .catch(() => {});
    memberApi
      .getMembers({ church_id: batch.church_id })
      .then((d) => setMembers(d.members.map((m) => ({ id: m.id, full_name: m.full_name }))))
      .catch(() => {});
  }, [batch.church_id]);

  async function addTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!txnFundId || !txnAmount) return;
    setSubmittingTxn(true);
    try {
      await financeApi.createTransaction({
        churchId: batch.church_id,
        fundId: txnFundId,
        amount: Number(txnAmount),
        description: txnDesc || undefined,
        batchId: batch.id,
        envelopeNumber: txnEnvelope ? Number(txnEnvelope) : undefined,
        memberId: txnMemberId || undefined,
      });
      setTxnAmount("");
      setTxnDesc("");
      setTxnEnvelope("");
      setTxnMemberId(0);
      setShowAddTxn(false);
      setError("");
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to add entry"
      );
    } finally {
      setSubmittingTxn(false);
    }
  }

  const isFullyConfirmed = batch.status === "confirmed" || batch.status === "synced";

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm text-brand hover:text-orange-600">
        &larr; Back to batches
      </button>
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Batch #{batch.id} &mdash; {batch.church_name}
            </h3>
            <p className="text-sm text-gray-500">Sabbath: {batch.sabbath_date}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              isFullyConfirmed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {batch.status}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Counted By:</span> {batch.submitted_by_email || "—"}
          </div>
          <div>
            <span className="text-gray-500">Confirmed (1):</span>{" "}
            {batch.confirmed_by_1_email || "—"}
            {batch.confirmed_at_1 && (
              <span className="ml-2 text-xs text-gray-400">
                {new Date(batch.confirmed_at_1).toLocaleString()}
              </span>
            )}
          </div>
          <div>
            <span className="text-gray-500">Confirmed (2):</span>{" "}
            {batch.confirmed_by_2_email || "—"}
            {batch.confirmed_at_2 && (
              <span className="ml-2 text-xs text-gray-400">
                {new Date(batch.confirmed_at_2).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {!isFullyConfirmed && (
          <button
            onClick={onConfirm}
            className="mt-4 rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-orange-600"
          >
            {batch.confirmed_by_1 ? "Confirm (2nd Custodian)" : "Confirm (1st Custodian)"}
          </button>
        )}

        {!isFullyConfirmed && !showAddTxn && (
          <button
            onClick={() => setShowAddTxn(true)}
            className="ml-3 mt-4 rounded-md border border-brand px-4 py-2 text-sm text-brand hover:bg-orange-50"
          >
            + Add Entry
          </button>
        )}

        {showAddTxn && (
          <form
            onSubmit={addTransaction}
            className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <h4 className="mb-3 text-sm font-medium text-gray-900">Add Contribution</h4>
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">Envelope #</label>
                <input
                  type="number"
                  value={txnEnvelope}
                  onChange={(e) => setTxnEnvelope(e.target.value)}
                  placeholder="#"
                  className="mt-1 w-20 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Member</label>
                <select
                  value={txnMemberId}
                  onChange={(e) => setTxnMemberId(Number(e.target.value))}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value={0}>Unnamed</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Fund</label>
                <select
                  required
                  value={txnFundId}
                  onChange={(e) => setTxnFundId(Number(e.target.value))}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value={0}>Select...</option>
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.type.replace("_", " ")})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={txnAmount}
                  onChange={(e) => setTxnAmount(e.target.value)}
                  className="mt-1 w-28 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  value={txnDesc}
                  onChange={(e) => setTxnDesc(e.target.value)}
                  placeholder="e.g. Cash/Check"
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={submittingTxn}
                  className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {submittingTxn ? "Adding..." : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTxn(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700">
            Contributions ({batch.transactions.length})
          </h4>
          {batch.transactions.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No entries yet.</p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Env</th>
                    <th className="pb-2 font-medium">Member</th>
                    <th className="pb-2 font-medium">Fund</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium">Entered By</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.transactions.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-2 text-gray-600">{t.envelope_number ?? "—"}</td>
                      <td className="py-2 text-gray-900">{t.member_name || "—"}</td>
                      <td className="py-2 text-gray-900">{t.fund_name}</td>
                      <td className="py-2 font-medium text-gray-900">
                        {t.amount.toLocaleString()}
                      </td>
                      <td className="py-2 text-gray-600">{t.description || "—"}</td>
                      <td className="py-2 text-gray-500">{t.created_by_email}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td colSpan={3} className="pt-2 text-right text-gray-700">
                      Total:
                    </td>
                    <td className="pt-2 text-gray-900">
                      {batch.transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TransactionsTab({
  conferenceId,
  churchId,
  setError,
}: {
  conferenceId: number;
  churchId?: number;
  setError: (e: string) => void;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterChurchId, setFilterChurchId] = useState(churchId ?? 0);
  const [filterType, setFilterType] = useState("");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenseFundId, setExpenseFundId] = useState(0);
  const [expenseCategoryId, setExpenseCategoryId] = useState(0);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [submittingExpense, setSubmittingExpense] = useState(false);

  const load = useCallback(async () => {
    try {
      const tData = await financeApi.getTransactions({
        ...(filterChurchId ? { church_id: filterChurchId } : {}),
        ...(filterType ? { type: filterType } : {}),
      });
      setTransactions(tData.transactions);
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to load transactions"
      );
    }
  }, [filterChurchId, filterType, setError]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    financeApi
      .getFunds(conferenceId)
      .then((d) => setFunds(d.funds))
      .catch(() => {});
    financeApi
      .getExpenseCategories(conferenceId)
      .then((d) => setCategories(d.expenseCategories))
      .catch(() => {});
  }, [conferenceId]);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!filterChurchId || !expenseFundId || !expenseAmount) return;
    setSubmittingExpense(true);
    try {
      await financeApi.createExpense({
        churchId: filterChurchId,
        fundId: expenseFundId,
        amount: Number(expenseAmount),
        description: expenseDesc || undefined,
        categoryId: expenseCategoryId || undefined,
      });
      setExpenseAmount("");
      setExpenseDesc("");
      setShowAddExpense(false);
      await load();
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to create expense"
      );
    } finally {
      setSubmittingExpense(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Church ID</label>
          <input
            type="number"
            value={filterChurchId || ""}
            onChange={(e) => setFilterChurchId(Number(e.target.value) || 0)}
            className="mt-1 w-28 rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Church ID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <button
          onClick={() => setShowAddExpense(true)}
          className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-orange-600"
        >
          + Expense
        </button>
      </div>

      {showAddExpense && (
        <form
          onSubmit={addExpense}
          className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <h4 className="mb-3 text-sm font-medium text-gray-900">Record Expense</h4>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Fund</label>
              <select
                required
                value={expenseFundId}
                onChange={(e) => setExpenseFundId(Number(e.target.value))}
                className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value={0}>Select...</option>
                {funds
                  .filter((f) => f.forwarding_rule === "local")
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Category</label>
              <select
                value={expenseCategoryId}
                onChange={(e) => setExpenseCategoryId(Number(e.target.value))}
                className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value={0}>None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="mt-1 w-28 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Description</label>
              <input
                type="text"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={submittingExpense}
                className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {submittingExpense ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddExpense(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Fund</th>
              <th className="px-4 py-3 font-medium">Church</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Confirmed</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.type === "income"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900">{t.fund_name}</td>
                  <td className="px-4 py-3 text-gray-600">{t.church_name}</td>
                  <td className="px-4 py-3 text-gray-600">{t.category_name || "—"}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {t.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.description || "—"}</td>
                  <td className="px-4 py-3">
                    {t.confirmed_by ? (
                      <span className="text-xs text-green-600">{t.confirmed_by_email}</span>
                    ) : (
                      <span className="text-xs text-yellow-600">Pending</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BudgetsTab({
  conferenceId,
  churchId,
  setError,
}: {
  conferenceId: number;
  churchId?: number;
  setError: (e: string) => void;
}) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [filterChurchId, setFilterChurchId] = useState(churchId ?? 0);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [showCreate, setShowCreate] = useState(false);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [bFundId, setBFundId] = useState(0);
  const [bCategoryId, setBCategoryId] = useState(0);
  const [bAmount, setBAmount] = useState("");
  const [bYear, setBYear] = useState(filterYear);
  const [submittingBudget, setSubmittingBudget] = useState(false);

  const load = useCallback(async () => {
    try {
      const bData = await financeApi.getBudgets({
        ...(filterChurchId ? { church_id: filterChurchId } : {}),
        ...(filterYear ? { fiscal_year: filterYear } : {}),
      });
      setBudgets(bData.budgets);
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to load budgets"
      );
    }
  }, [filterChurchId, filterYear, setError]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    financeApi
      .getFunds(conferenceId)
      .then((d) => setFunds(d.funds))
      .catch(() => {});
    financeApi
      .getExpenseCategories(conferenceId)
      .then((d) => setCategories(d.expenseCategories))
      .catch(() => {});
  }, [conferenceId]);

  async function createBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!filterChurchId || !bFundId || !bCategoryId || !bAmount) return;
    setSubmittingBudget(true);
    try {
      await financeApi.createBudget({
        churchId: filterChurchId,
        fundId: bFundId,
        categoryId: bCategoryId,
        plannedAmount: Number(bAmount),
        fiscalYear: bYear,
      });
      setBAmount("");
      setShowCreate(false);
      await load();
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to create budget"
      );
    } finally {
      setSubmittingBudget(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Church ID</label>
          <input
            type="number"
            value={filterChurchId || ""}
            onChange={(e) => setFilterChurchId(Number(e.target.value) || 0)}
            className="mt-1 w-28 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fiscal Year</label>
          <input
            type="number"
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="mt-1 w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-orange-600"
        >
          + Budget
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={createBudget}
          className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <h4 className="mb-3 text-sm font-medium text-gray-900">Create Budget Line</h4>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Fund</label>
              <select
                required
                value={bFundId}
                onChange={(e) => setBFundId(Number(e.target.value))}
                className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value={0}>Select...</option>
                {funds.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Category</label>
              <select
                required
                value={bCategoryId}
                onChange={(e) => setBCategoryId(Number(e.target.value))}
                className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value={0}>Select...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={bAmount}
                onChange={(e) => setBAmount(e.target.value)}
                className="mt-1 w-28 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Year</label>
              <input
                type="number"
                value={bYear}
                onChange={(e) => setBYear(Number(e.target.value))}
                className="mt-1 w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={submittingBudget}
                className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {submittingBudget ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Church</th>
              <th className="px-4 py-3 font-medium">Fund</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Year</th>
              <th className="px-4 py-3 font-medium">Planned</th>
              <th className="px-4 py-3 font-medium">Spent</th>
              <th className="px-4 py-3 font-medium">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {budgets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No budgets found.
                </td>
              </tr>
            ) : (
              budgets.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{b.church_name}</td>
                  <td className="px-4 py-3 text-gray-900">{b.fund_name}</td>
                  <td className="px-4 py-3 text-gray-700">{b.category_name}</td>
                  <td className="px-4 py-3 text-gray-700">{b.fiscal_year}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {b.planned_amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-red-600">{b.spent_amount.toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {(b.planned_amount - b.spent_amount).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsTab({
  _conferenceId,
  churchId,
  setError,
}: {
  _conferenceId: number;
  churchId?: number;
  setError: (e: string) => void;
}) {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [rChurchId, setRChurchId] = useState(churchId ?? 0);
  const [rYear, setRYear] = useState(new Date().getFullYear());
  const [rMonth, setRMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);

  async function loadReport() {
    if (!rChurchId) return;
    setLoading(true);
    try {
      const r = await financeApi.getMonthlyReport(rChurchId, rYear, rMonth);
      setReport(r.report);
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to load report"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Church ID</label>
          <input
            type="number"
            value={rChurchId || ""}
            onChange={(e) => setRChurchId(Number(e.target.value) || 0)}
            className="mt-1 w-28 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Year</label>
          <input
            type="number"
            value={rYear}
            onChange={(e) => setRYear(Number(e.target.value))}
            className="mt-1 w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Month</label>
          <select
            value={rMonth}
            onChange={(e) => setRMonth(Number(e.target.value))}
            className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={loadReport}
          disabled={loading}
          className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Generate Report"}
        </button>
      </div>

      {report && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-900">
            Monthly Treasurer Report —{" "}
            {new Date(report.period.year, report.period.month - 1).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h3>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Opening Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {report.openingBalance.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-600">Total Income</p>
              <p className="text-2xl font-bold text-green-700">
                {report.totalIncome.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-700">
                {report.totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">Income by Fund</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Fund</th>
                    <th className="pb-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.incomeByFund.map((f) => (
                    <tr key={f.id} className="border-b last:border-0">
                      <td className="py-2 text-gray-900">{f.fund_name}</td>
                      <td className="py-2 font-medium text-gray-900">{f.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">Expenses by Category</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Spent</th>
                    <th className="pb-2 font-medium">Budget</th>
                    <th className="pb-2 font-medium">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {report.expensesByCategory.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 text-gray-900">{c.category_name}</td>
                      <td className="py-2 text-red-600">{c.total.toLocaleString()}</td>
                      <td className="py-2 text-gray-600">{c.budgeted.toLocaleString()}</td>
                      <td className="py-2 font-medium text-gray-900">
                        {c.remaining.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Closing Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              {report.closingBalance.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SetupTab({
  conferenceId,
  setError,
}: {
  conferenceId: number;
  setError: (e: string) => void;
}) {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [newFundName, setNewFundName] = useState("");
  const [newFundType, setNewFundType] = useState("tithe");
  const [newFundRule, setNewFundRule] = useState("conference");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [submittingFund, setSubmittingFund] = useState(false);
  const [submittingCategory, setSubmittingCategory] = useState(false);

  const load = useCallback(async () => {
    try {
      const fData = await financeApi.getFunds(conferenceId);
      setFunds(fData.funds);
      const cData = await financeApi.getExpenseCategories(conferenceId);
      setCategories(cData.expenseCategories);
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to load setup data"
      );
    }
  }, [conferenceId, setError]);

  useEffect(() => {
    load();
  }, [load]);

  async function addFund(e: React.FormEvent) {
    e.preventDefault();
    if (!newFundName) return;
    setSubmittingFund(true);
    try {
      await financeApi.createFund({
        name: newFundName,
        type: newFundType,
        forwardingRule: newFundRule,
        conferenceId,
      });
      setNewFundName("");
      await load();
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to create fund"
      );
    } finally {
      setSubmittingFund(false);
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName) return;
    setSubmittingCategory(true);
    try {
      await financeApi.createExpenseCategory({ name: newCategoryName, conferenceId });
      setNewCategoryName("");
      await load();
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to create category"
      );
    } finally {
      setSubmittingCategory(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900">Funds</h3>
        <form onSubmit={addFund} className="mt-3 flex flex-wrap gap-2">
          <input
            type="text"
            required
            value={newFundName}
            onChange={(e) => setNewFundName(e.target.value)}
            placeholder="Fund name"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={newFundType}
            onChange={(e) => setNewFundType(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="tithe">Tithe</option>
            <option value="local_budget">Local Budget</option>
            <option value="sabbath_school">Sabbath School</option>
          </select>
          <select
            value={newFundRule}
            onChange={(e) => setNewFundRule(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="conference">Forwards to Conference</option>
            <option value="local">Stays Local</option>
          </select>
          <button
            type="submit"
            disabled={submittingFund}
            className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {submittingFund ? "Adding..." : "Add Fund"}
          </button>
        </form>
        {funds.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No funds configured yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100">
            {funds.map((f) => (
              <li key={f.id} className="flex justify-between py-2 text-sm">
                <div>
                  <span className="font-medium text-gray-900">{f.name}</span>
                  <span className="ml-2 text-xs text-gray-500 capitalize">
                    {f.type.replace("_", " ")}
                  </span>
                </div>
                <span className="text-gray-500 capitalize">{f.forwarding_rule}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900">Expense Categories</h3>
        <form onSubmit={addCategory} className="mt-3 flex gap-2">
          <input
            type="text"
            required
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submittingCategory}
            className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {submittingCategory ? "Adding..." : "Add Category"}
          </button>
        </form>
        {categories.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No categories configured yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100">
            {categories.map((c) => (
              <li key={c.id} className="py-2 text-sm text-gray-900">
                {c.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
