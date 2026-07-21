import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  fetchTransactions,
  createTransaction,
  verifyTransaction,
  FUNDS,
  type Transaction,
} from "../lib/api";

export default function Finance() {
  const queryClient = useQueryClient();
  const [fund, setFund] = useState("");
  const [txType, setTxType] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", fund, txType, page],
    queryFn: () =>
      fetchTransactions("church-1", {
        fund: fund || undefined,
        type: txType || undefined,
        page,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (d: {
      fund: string;
      amount: number;
      type: string;
      description?: string;
    }) => createTransaction("church-1", d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setShowForm(false);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => verifyTransaction("church-1", id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  function fmtAmount(tx: Transaction) {
    const sign = tx.type === "receipt" ? "+" : "-";
    const color = tx.type === "receipt" ? "text-green-700" : "text-red-700";
    return (
      <span className={color}>
        {sign}${tx.amount.toFixed(2)}
      </span>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Finance</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800"
        >
          {showForm ? "Cancel" : "Add Transaction"}
        </button>
      </div>

      {showForm && (
        <AddTransactionForm
          onClose={() => setShowForm(false)}
          onSubmit={(d) => createMutation.mutate(d)}
          loading={createMutation.isPending}
        />
      )}

      <div className="flex gap-4 mb-4">
        <select
          value={fund}
          onChange={(e) => {
            setFund(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">All funds</option>
          {FUNDS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          value={txType}
          onChange={(e) => {
            setTxType(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="receipt">Receipts</option>
          <option value="disbursement">Disbursements</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-sm font-medium text-gray-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Fund</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 text-sm">
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{tx.fund}</td>
                    <td className="px-4 py-3">{tx.type}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {fmtAmount(tx)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {tx.description ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      {tx.verified ? (
                        <span className="text-green-700 text-xs font-medium">
                          Verified
                        </span>
                      ) : (
                        <span className="text-yellow-700 text-xs font-medium">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!tx.verified && (
                        <button
                          onClick={() => verifyMutation.mutate(tx.id)}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          Verify
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && (
            <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
              <span>Total: {data.total} transactions</span>
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
                  disabled={(data.transactions.length ?? 0) < 50}
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

function AddTransactionForm({
  onClose,
  onSubmit,
  loading,
}: {
  onClose: () => void;
  onSubmit: (d: {
    fund: string;
    amount: number;
    type: string;
    description?: string;
  }) => void;
  loading: boolean;
}) {
  const [fund, setFund] = useState("tithe");
  const [type, setType] = useState("receipt");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      fund,
      amount: parseFloat(amount),
      type,
      description: desc || undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow mb-6 space-y-4"
    >
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="receipt">Receipt (in)</option>
            <option value="disbursement">Disbursement (out)</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fund
          </label>
          <select
            value={fund}
            onChange={(e) => setFund(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {FUNDS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div className="w-32">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
