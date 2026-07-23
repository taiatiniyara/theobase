import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import {
  attendanceApi,
  type AttendanceRecord,
  type AttendanceStats,
  type AttendanceTrendPoint,
} from "../lib/api";

const CATEGORIES = [
  { value: "sabbath-school", label: "Sabbath School" },
  { value: "church-service", label: "Church Service" },
  { value: "youth", label: "Youth" },
] as const;

function TrendLine({ points, category }: { points: AttendanceTrendPoint[]; category: string }) {
  const filtered = points.filter((p) => p.category === category);
  if (filtered.length < 2) return <span className="text-xs text-gray-400">Not enough data</span>;
  const values = filtered.map((p) => p.count);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 120;
  const height = 30;
  const stepX = width / (filtered.length - 1);
  const points_ = filtered
    .map((p, i) => `${i * stepX},${height - ((p.count - min) / range) * (height - 4) - 2}`)
    .join(" ");
  return (
    <svg width={width} height={height} className="inline-block">
      <polyline points={points_} fill="none" stroke="#F97316" strokeWidth="1.5" />
    </svg>
  );
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"record" | "history" | "stats">("record");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats[]>([]);
  const [trend, setTrend] = useState<AttendanceTrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [count, setCount] = useState("");
  const [category, setCategory] = useState<string>("sabbath-school");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const churchId = user?.church?.id;

  const loadHistory = useCallback(async () => {
    if (!churchId) return;
    setLoading(true);
    try {
      const data = await attendanceApi.list({
        church_id: churchId,
        from: fromDate || undefined,
        to: toDate || undefined,
        category: filterCategory || undefined,
      });
      setRecords(data.attendance);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [churchId, fromDate, toDate, filterCategory]);

  const loadStats = useCallback(async () => {
    if (!churchId) return;
    setLoading(true);
    try {
      const data = await attendanceApi.stats({
        church_id: churchId,
        from: fromDate || undefined,
        to: toDate || undefined,
        category: filterCategory || undefined,
      });
      setStats(data.stats);
      setTrend(data.trend);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [churchId, fromDate, toDate, filterCategory]);

  useEffect(() => {
    if (tab === "history") loadHistory();
    if (tab === "stats") loadStats();
  }, [tab, loadHistory, loadStats]);

  const handleRecord = async (e: FormEvent) => {
    e.preventDefault();
    if (!churchId || !date || !count || !category) {
      setMessage("Please fill in all fields");
      return;
    }
    const countNum = parseInt(count, 10);
    if (isNaN(countNum) || countNum < 0) {
      setMessage("Count must be a non-negative number");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const result = await attendanceApi.record({
        churchId,
        date,
        count: countNum,
        category,
      });
      setMessage(
        result.updated ? "Attendance updated successfully" : "Attendance recorded successfully"
      );
      setCount("");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to record attendance");
    } finally {
      setLoading(false);
    }
  };

  if (!churchId) {
    return (
      <div className="p-6">
        <p className="text-gray-500">You are not assigned to a specific church.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Attendance Tracking</h1>

      <div className="mb-6 flex gap-2 border-b">
        {(["record", "history", "stats"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t
                ? "border-b-2 border-orange-500 text-orange-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "record" ? "Record" : t === "history" ? "History" : "Stats"}
          </button>
        ))}
      </div>

      {message && (
        <div className="mb-4 rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          {message}
        </div>
      )}

      {tab === "record" && (
        <form onSubmit={handleRecord} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Count</label>
            <input
              type="number"
              min="0"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="Enter attendance count"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Record Attendance"}
          </button>
        </form>
      )}

      {tab === "history" && (
        <div>
          <div className="mb-4 flex flex-wrap gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="mt-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-orange-500 focus:outline-none"
              >
                <option value="">All</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-gray-500">No attendance records found.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Date</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Category</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-700">{r.date}</td>
                      <td className="px-4 py-2 text-gray-700 capitalize">
                        {CATEGORIES.find((c) => c.value === r.category)?.label ?? r.category}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-700">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "stats" && (
        <div>
          <div className="mb-4 flex flex-wrap gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="mt-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-orange-500 focus:outline-none"
              >
                <option value="">All</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : stats.length === 0 ? (
            <p className="text-sm text-gray-500">No stats available.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {stats.map((s) => (
                  <div key={s.category} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="text-xs font-medium text-gray-500 uppercase">
                      {CATEGORIES.find((c) => c.value === s.category)?.label ?? s.category}
                    </div>
                    <div className="mt-1 text-2xl font-bold text-orange-600">
                      {s.average !== null ? Math.round(s.average) : "-"}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">Average (over {s.weeks} weeks)</div>
                    <div className="mt-1 flex gap-3 text-xs text-gray-500">
                      <span>Min: {s.min ?? "-"}</span>
                      <span>Max: {s.max ?? "-"}</span>
                    </div>
                    <div className="mt-2">
                      <TrendLine points={trend} category={s.category} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
