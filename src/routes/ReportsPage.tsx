import { useState } from "react";
import { financeApi, type QuarterlyReport } from "../lib/api";

export default function ReportsPage() {
  const [churchId, setChurchId] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3).toString());
  const [report, setReport] = useState<QuarterlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await financeApi.getQuarterlyReport(
        Number(churchId),
        Number(year),
        Number(quarter)
      );
      setReport(res.report);
    } catch {
      setError("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const quarterLabel = `Q${quarter} ${year}`;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Quarterly Business Meeting Report</h2>
      <p className="mt-1 text-sm text-gray-500">
        Combined membership + finance report for church business meetings.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-xs font-medium text-gray-600">Church ID</label>
          <input
            type="number"
            value={churchId}
            onChange={(e) => setChurchId(e.target.value)}
            placeholder="Church ID"
            className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="mt-1 block w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Quarter</label>
          <select
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            className="mt-1 block w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="1">Q1</option>
            <option value="2">Q2</option>
            <option value="3">Q3</option>
            <option value="4">Q4</option>
          </select>
        </div>
        <button
          onClick={generate}
          disabled={loading || !churchId}
          className="rounded-md bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {report && (
        <div className="mt-6 space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="border-b border-gray-200 pb-4 text-center">
              <h3 className="text-lg font-bold text-gray-900">Quarterly Business Meeting Report</h3>
              <p className="text-sm text-gray-500">{quarterLabel}</p>
            </div>

            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-800">Membership</h4>
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase">
                    <th className="py-2">Category</th>
                    <th className="py-2 text-right">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2 text-gray-600">Opening count</td>
                    <td className="py-2 text-right font-medium">{report.membership.opening}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pl-6 text-gray-500">Baptisms</td>
                    <td className="py-2 text-right text-green-600">
                      +{report.membership.baptisms}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pl-6 text-gray-500">Professions of faith</td>
                    <td className="py-2 text-right text-green-600">
                      +{report.membership.professions}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pl-6 text-gray-500">Transfers in</td>
                    <td className="py-2 text-right text-green-600">
                      +{report.membership.transfersIn}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pl-6 text-gray-500">Transfers out</td>
                    <td className="py-2 text-right text-red-600">
                      −{report.membership.transfersOut}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pl-6 text-gray-500">Deaths</td>
                    <td className="py-2 text-right text-red-600">−{report.membership.deaths}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pl-6 text-gray-500">Removals</td>
                    <td className="py-2 text-right text-red-600">−{report.membership.removals}</td>
                  </tr>
                  <tr className="border-t-2 border-gray-300 font-semibold">
                    <td className="py-2 text-gray-800">Closing count</td>
                    <td className="py-2 text-right">{report.membership.closing}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-800">Finance</h4>
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase">
                    <th className="py-2">Category</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2 text-gray-600">Tithe forwarded</td>
                    <td className="py-2 text-right font-medium">
                      ${report.finance.titheForwarded.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600">Local Budget income</td>
                    <td className="py-2 text-right text-green-600">
                      ${report.finance.localBudgetIncome.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600">Local Budget expenses</td>
                    <td className="py-2 text-right text-red-600">
                      ${report.finance.localBudgetExpenses.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="py-2 font-medium text-gray-800">Local Budget balance</td>
                    <td
                      className={`py-2 text-right font-medium ${
                        report.finance.localBudgetBalance >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ${report.finance.localBudgetBalance.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600">Sabbath School forwarded</td>
                    <td className="py-2 text-right font-medium">
                      ${report.finance.sabbathSchoolForwarded.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-800">Current Officers</h4>
              {report.officers.length > 0 ? (
                <table className="mt-2 w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase">
                      <th className="py-2">Name</th>
                      <th className="py-2">Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.officers.map((o, i) => (
                      <tr key={i}>
                        <td className="py-2 text-gray-800">{o.memberName}</td>
                        <td className="py-2 text-gray-600">{o.positionName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="mt-2 text-sm text-gray-500">No officers assigned.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
