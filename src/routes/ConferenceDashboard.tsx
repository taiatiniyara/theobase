import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { KPICard } from "../components/ui/KPICard";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { PageSkeleton } from "../components/ui/Skeleton";

interface ChurchMetric {
  id: number;
  name: string;
  type: string;
  districtName: string;
  titheMtd: number;
  memberCount: number;
  baptismsYtd: number;
}

interface ConferenceSummary {
  titheForwardedThisMonth: number;
  totalMembership: number;
  baptismsThisYear: number;
  churchCount: number;
}

interface District {
  id: number;
  name: string;
}

export default function ConferenceDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ConferenceSummary | null>(null);
  const [churches, setChurches] = useState<ChurchMetric[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const fetchData = async (districtId?: string) => {
    setLoading(true);
    try {
      const qs = districtId ? `?district_id=${districtId}` : "";
      const data = await api.get<{
        summary: ConferenceSummary;
        churches: ChurchMetric[];
        districts: District[];
      }>(`/conference/dashboard${qs}`);
      setSummary(data.summary);
      setChurches(data.churches);
      setDistricts(data.districts);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedChurches = [...churches].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const aVal = a[sortField as keyof ChurchMetric];
    const bVal = b[sortField as keyof ChurchMetric];
    if (typeof aVal === "string" && typeof bVal === "string") return aVal.localeCompare(bVal) * dir;
    return ((aVal as number) - (bVal as number)) * dir;
  });

  if (
    !user ||
    !["sysadmin", "president", "secretary", "treasurer", "auditor"].includes(user.role)
  ) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow">
        <p className="text-gray-500">
          Conference dashboard is available to conference officers only.
        </p>
      </div>
    );
  }

  if (loading) return <PageSkeleton />;

  return (
    <div>
      <PageHeader
        title="Conference Dashboard"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => fetchData(selectedDistrict || undefined)}
          >
            Refresh
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Tithe This Month"
          value={`$${(summary?.titheForwardedThisMonth ?? 0).toLocaleString()}`}
        />
        <KPICard title="Total Membership" value={String(summary?.totalMembership ?? 0)} />
        <KPICard title="Baptisms This Year" value={String(summary?.baptismsThisYear ?? 0)} />
        <KPICard title="Churches" value={String(summary?.churchCount ?? 0)} />
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-gray-700">
          Filter by District:
          <select
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              fetchData(e.target.value || undefined);
            }}
            className="ml-2 rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="">All Districts</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <SortHeader
                label="Church"
                field="name"
                current={sortField}
                dir={sortDir}
                onClick={handleSort}
              />
              <SortHeader
                label="Type"
                field="type"
                current={sortField}
                dir={sortDir}
                onClick={handleSort}
              />
              <SortHeader
                label="District"
                field="districtName"
                current={sortField}
                dir={sortDir}
                onClick={handleSort}
              />
              <SortHeader
                label="Tithe (MTD)"
                field="titheMtd"
                current={sortField}
                dir={sortDir}
                onClick={handleSort}
              />
              <SortHeader
                label="Members"
                field="memberCount"
                current={sortField}
                dir={sortDir}
                onClick={handleSort}
              />
              <SortHeader
                label="Baptisms (YTD)"
                field="baptismsYtd"
                current={sortField}
                dir={sortDir}
                onClick={handleSort}
              />
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedChurches.map((church) => (
              <tr key={church.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-900">{church.name}</td>
                <td className="px-4 py-2 capitalize text-gray-600">{church.type}</td>
                <td className="px-4 py-2 text-gray-600">{church.districtName}</td>
                <td className="px-4 py-2 text-gray-600">${church.titheMtd.toLocaleString()}</td>
                <td className="px-4 py-2 text-gray-600">{church.memberCount}</td>
                <td className="px-4 py-2 text-gray-600">{church.baptismsYtd}</td>
              </tr>
            ))}
            {sortedChurches.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                  No churches found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  field,
  current,
  dir,
  onClick,
}: {
  label: string;
  field: string;
  current: string;
  dir: "asc" | "desc";
  onClick: (f: string) => void;
}) {
  return (
    <th
      className="cursor-pointer px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700"
      onClick={() => onClick(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {current === field && <span className="text-brand">{dir === "asc" ? "▲" : "▼"}</span>}
      </span>
    </th>
  );
}
