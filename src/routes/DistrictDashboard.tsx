import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";

interface ChurchMetric {
  id: number;
  name: string;
  type: string;
  titheMtd: number;
  memberCount: number;
  baptismsYtd: number;
}

interface DistrictSummary {
  titheForwardedThisMonth: number;
  totalMembership: number;
  baptismsThisYear: number;
  churchCount: number;
}

export default function DistrictDashboard() {
  const { user } = useAuth();
  const [districtName, setDistrictName] = useState<string>("");
  const [summary, setSummary] = useState<DistrictSummary | null>(null);
  const [churches, setChurches] = useState<ChurchMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get<{
        district: { id: number; name: string };
        summary: DistrictSummary;
        churches: ChurchMetric[];
      }>("/conference/district-dashboard");
      setDistrictName(data.district.name);
      setSummary(data.summary);
      setChurches(data.churches);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!user || !["pastor"].includes(user.role)) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow">
        <p className="text-gray-500">District dashboard is available to district pastors only.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">District Dashboard</h2>
          {districtName && <p className="text-sm text-gray-500">{districtName} District</p>}
        </div>
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
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Tithe This Month"
              value={`$${(summary?.titheForwardedThisMonth ?? 0).toLocaleString()}`}
            />
            <SummaryCard label="Total Membership" value={String(summary?.totalMembership ?? 0)} />
            <SummaryCard
              label="Baptisms This Year"
              value={String(summary?.baptismsThisYear ?? 0)}
            />
            <SummaryCard label="Churches" value={String(summary?.churchCount ?? 0)} />
          </div>

          <div className="mt-6 overflow-x-auto rounded-lg bg-white shadow">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                    Church
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tithe (MTD)
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                    Members
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                    Baptisms (YTD)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {churches.map((church) => (
                  <tr key={church.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{church.name}</td>
                    <td className="px-4 py-2 capitalize text-gray-600">{church.type}</td>
                    <td className="px-4 py-2 text-gray-600">${church.titheMtd.toLocaleString()}</td>
                    <td className="px-4 py-2 text-gray-600">{church.memberCount}</td>
                    <td className="px-4 py-2 text-gray-600">{church.baptismsYtd}</td>
                  </tr>
                ))}
                {churches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                      No churches in district
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
