import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";

interface GlobalSummary {
  titheForwardedThisMonth: number;
  totalMembership: number;
  baptismsThisYear: number;
  churchCount: number;
  conferenceCount: number;
}

interface MonthlyTrend {
  month: string;
  tithe: number;
}

export default function GlobalDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<GlobalSummary | null>(null);
  const [trend, setTrend] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get<{
        summary: GlobalSummary;
        monthlyTrend: MonthlyTrend[];
      }>("/conference/global-dashboard");
      setSummary(data.summary);
      setTrend(data.monthlyTrend);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (
    !user ||
    !["sysadmin", "president", "secretary", "treasurer", "auditor"].includes(user.role)
  ) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow">
        <p className="text-gray-500">Global dashboard is available to conference officers only.</p>
      </div>
    );
  }

  const maxTithe = Math.max(...trend.map((t) => t.tithe), 1);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Global Dashboard</h2>
        <button
          onClick={fetchData}
          className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="mt-4 text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard
              label="Tithe This Month (All)"
              value={`$${(summary?.titheForwardedThisMonth ?? 0).toLocaleString()}`}
            />
            <SummaryCard
              label="Total Membership (All)"
              value={String(summary?.totalMembership ?? 0)}
            />
            <SummaryCard
              label="Baptisms This Year (All)"
              value={String(summary?.baptismsThisYear ?? 0)}
            />
            <SummaryCard label="Total Churches" value={String(summary?.churchCount ?? 0)} />
            <SummaryCard label="Conferences" value={String(summary?.conferenceCount ?? 0)} />
          </div>

          <div className="mt-6 rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-gray-900">
              Monthly Tithe Trend (Current Year)
            </h3>
            <div className="mt-4 flex items-end gap-2" style={{ height: "200px" }}>
              {trend.map((t) => {
                const height = maxTithe > 0 ? (t.tithe / maxTithe) * 160 : 0;
                const monthLabel = t.month.slice(5);
                return (
                  <div key={t.month} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs text-gray-600">${Math.round(t.tithe / 1000)}k</span>
                    <div
                      className="w-full rounded-t bg-brand"
                      style={{ height: `${Math.max(height, 2)}px`, minWidth: "20px" }}
                    />
                    <span className="text-xs text-gray-500">{monthLabel}</span>
                  </div>
                );
              })}
            </div>
            {trend.length === 0 && (
              <p className="text-center text-sm text-gray-500">No data available</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
