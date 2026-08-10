import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { KPICard } from "../components/ui/KPICard";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { PageSkeleton } from "../components/ui/Skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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

  if (loading) return <PageSkeleton />;

  return (
    <div>
      <PageHeader
        title="Global Dashboard"
        actions={
          <Button variant="primary" size="sm" onClick={fetchData}>
            Refresh
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Tithe This Month (All)"
          value={`$${(summary?.titheForwardedThisMonth ?? 0).toLocaleString()}`}
        />
        <KPICard title="Total Membership (All)" value={String(summary?.totalMembership ?? 0)} />
        <KPICard title="Baptisms This Year (All)" value={String(summary?.baptismsThisYear ?? 0)} />
        <KPICard title="Total Churches" value={String(summary?.churchCount ?? 0)} />
        <KPICard title="Conferences" value={String(summary?.conferenceCount ?? 0)} />
      </div>

      <div className="mt-6 rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-medium text-gray-900">Monthly Tithe Trend (Current Year)</h3>
        {trend.length === 0 ? (
          <p className="mt-4 text-center text-sm text-gray-500">No data available</p>
        ) : (
          <div className="mt-4" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <YAxis
                  tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Tithe"]}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  labelFormatter={(label: any) => `Month: ${label}`}
                />
                <Bar dataKey="tithe" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
