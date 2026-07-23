import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../lib/auth";
import { contributionApi, type ContributionSummary, type ContributionStatement } from "../lib/api";

const FUND_LABELS: Record<string, string> = {
  tithe: "Tithe",
  local_budget: "Local Budget",
  sabbath_school: "Sabbath School",
};

const FUND_ORDER = ["tithe", "local_budget", "sabbath_school"];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function ContributionsPage() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [contributions, setContributions] = useState<ContributionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statement, setStatement] = useState<ContributionStatement | null>(null);

  const churchId = user?.church?.id;

  const loadContributions = useCallback(async () => {
    if (!churchId) return;
    setLoading(true);
    setError("");
    try {
      const data = await contributionApi.getContributions(churchId, year);
      setContributions(data.contributions);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load contributions";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [churchId, year]);

  useEffect(() => {
    loadContributions();
  }, [loadContributions]);

  const viewStatement = async (donorId: number) => {
    if (!churchId) return;
    setLoading(true);
    setError("");
    try {
      const data = await contributionApi.getStatement(donorId, churchId, year);
      setStatement(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load statement";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const printStatement = () => {
    window.print();
  };

  const fundTypes = (totals: Record<string, number>): string[] => {
    const keys = Object.keys(totals);
    const ordered = FUND_ORDER.filter((f) => keys.includes(f));
    const extra = keys.filter((k) => !FUND_ORDER.includes(k));
    return [...ordered, ...extra];
  };

  if (!churchId) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Contribution Statements</h2>
        <p className="mt-4 text-gray-600">No church assigned.</p>
      </div>
    );
  }

  if (statement) {
    const funds = fundTypes(statement.totals);
    return (
      <div>
        <div className="flex items-center justify-between print:hidden">
          <button
            onClick={() => setStatement(null)}
            className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
          >
            &larr; Back to List
          </button>
          <button
            onClick={printStatement}
            className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            Print Statement
          </button>
        </div>

        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 print:border-0 print:p-0">
          <div className="text-center print:mb-6">
            <h1 className="text-xl font-bold text-gray-900">{statement.churchName}</h1>
            <p className="text-sm text-gray-600">Annual Contribution Statement</p>
            <p className="text-sm text-gray-600">{statement.year}</p>
          </div>

          <div className="mt-6 border-b border-gray-200 pb-4">
            <p className="text-sm text-gray-600">Donor:</p>
            <p className="text-lg font-semibold text-gray-900">{statement.donorName}</p>
          </div>

          <div className="mt-4">
            <h2 className="text-sm font-semibold text-gray-900">Contribution Summary</h2>
            <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Fund
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {funds.map((fund) => (
                    <tr key={fund}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {FUND_LABELS[fund] || fund}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-gray-900">
                        {formatCurrency(statement.totals[fund]!)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-4 py-2 text-sm text-gray-900">Grand Total</td>
                    <td className="px-4 py-2 text-right text-sm text-gray-900">
                      {formatCurrency(statement.grandTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {statement.transactions.length > 0 && (
            <div className="mt-6 print:mt-4">
              <h2 className="text-sm font-semibold text-gray-900">Transaction Detail</h2>
              <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 print:text-xs">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Fund
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase print:hidden">
                        Envelope #
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {statement.transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-3 py-1.5 text-sm text-gray-600">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-1.5 text-sm text-gray-900">{tx.fundName}</td>
                        <td className="px-3 py-1.5 text-right text-sm text-gray-900">
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="px-3 py-1.5 text-right text-sm text-gray-500 print:hidden">
                          {tx.envelopeNumber ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 text-center text-xs text-gray-500 print:mt-6">
            <p>
              This statement confirms that {statement.donorName} contributed the above amounts to{" "}
              {statement.churchName} during the {statement.year} tax year.
            </p>
            <p className="mt-1 font-medium">
              No goods or services were provided in exchange for these contributions.
            </p>
            <p className="mt-4 text-gray-400 print:hidden">
              Generated by Theobase Church Management Platform
            </p>
          </div>
        </div>
      </div>
    );
  }

  const availableYears: number[] = [];
  for (let y = currentYear; y >= currentYear - 5; y--) {
    availableYears.push(y);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Contribution Statements</h2>
        <div className="flex items-center gap-3">
          <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
            Year:
          </label>
          <select
            id="year-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading && !contributions.length ? (
        <div className="mt-8 text-center text-gray-500">Loading...</div>
      ) : contributions.length === 0 ? (
        <div className="mt-8 text-center text-gray-500">
          No contributions found for {year}. Contributions are tracked when transactions are linked
          to member donors.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Donor
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Tithe
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Local Budget
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Sabbath School
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Transactions
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Statement
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contributions.map((c) => (
                  <tr key={c.donorId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.donorName}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {formatCurrency(c.totals.tithe || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {formatCurrency(c.totals.local_budget || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {formatCurrency(c.totals.sabbath_school || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(c.grandTotal)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500">
                      {c.transactionCount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => viewStatement(c.donorId)}
                        className="rounded bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-orange-600"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
