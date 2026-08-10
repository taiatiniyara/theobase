import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { PageSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";

interface DivisionAttendance {
  division: string;
  count: number;
}

interface WeeklyRecord {
  id: number;
  sabbathDate: string;
  divisions: DivisionAttendance[];
  total: number;
}

const DIVISIONS = [
  "Cradle Roll",
  "Kindergarten",
  "Primary",
  "Junior",
  "Earliteen",
  "Youth",
  "Adult",
];

export default function SabbathSchoolPage() {
  const [records, setRecords] = useState<WeeklyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sabbathDate, setSabbathDate] = useState(getLastSabbath());
  const [attendance, setAttendance] = useState<Record<string, number>>({});
  const [success, setSuccess] = useState("");
  const [view, setView] = useState<"record" | "history">("record");

  function getLastSabbath(): string {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 1 : day - 6 > 0 ? day - 6 : -(6 - day)));
    return d.toISOString().slice(0, 10);
  }

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    setLoading(true);
    try {
      const data = await api.get<{ records: WeeklyRecord[] }>("/sabbath-school");
      setRecords(data.records);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleRecord() {
    setSaving(true);
    setSuccess("");
    try {
      const divisions = DIVISIONS.filter((d) => attendance[d] != null).map((d) => ({
        division: d,
        count: attendance[d] ?? 0,
      }));
      await api.post("/sabbath-school", { sabbathDate, divisions });
      setSuccess("Attendance recorded successfully");
      setAttendance({});
      await loadRecords();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  const thisWeek = records.find((r) => r.sabbathDate === sabbathDate);

  if (loading) return <PageSkeleton />;

  return (
    <div>
      <PageHeader
        title="Sabbath School Attendance"
        description="Record and track attendance by division"
      />

      {/* Tab toggle */}
      <div className="mt-4 flex space-x-1 border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            view === "record"
              ? "border-b-2 border-brand text-brand"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setView("record")}
        >
          Record Attendance
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            view === "history"
              ? "border-b-2 border-brand text-brand"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setView("history")}
        >
          History
        </button>
      </div>

      {view === "record" ? (
        <div className="mt-6 max-w-md">
          {success && (
            <div className="mb-4 rounded bg-success-bg p-3 text-sm text-success-text">
              {success}
            </div>
          )}
          <div className="space-y-4 rounded-lg bg-white p-6 shadow">
            <Input
              label="Sabbath Date"
              type="date"
              value={sabbathDate}
              onChange={(e) => setSabbathDate(e.target.value)}
            />
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Attendance by Division</h3>
              {DIVISIONS.map((div) => (
                <Input
                  key={div}
                  label={div}
                  type="number"
                  min="0"
                  value={String(attendance[div] ?? "")}
                  onChange={(e) =>
                    setAttendance((prev) => ({
                      ...prev,
                      [div]: e.target.value ? Number(e.target.value) : 0,
                    }))
                  }
                />
              ))}
            </div>
            <Button onClick={handleRecord} loading={saving} className="w-full">
              Record Attendance
            </Button>
            {thisWeek && (
              <div className="mt-3 rounded bg-gray-50 p-3 text-sm">
                <p className="font-medium text-gray-700">This week already recorded</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {thisWeek.divisions.map((d) => (
                    <Badge key={d.division} variant="info">
                      {d.division}: {d.count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6">
          {records.length === 0 ? (
            <EmptyState
              title="No attendance records yet"
              description="Record your first Sabbath School attendance above."
            />
          ) : (
            <div className="space-y-4">
              {records.map((week) => (
                <div key={week.id} className="rounded-lg bg-white p-4 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Sabbath, {new Date(week.sabbathDate + "T12:00:00").toLocaleDateString()}
                      </h3>
                      <p className="text-sm text-gray-500">Total: {week.total}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {week.divisions.map((d) => (
                      <Badge key={d.division} variant={d.count > 0 ? "brand" : "neutral"}>
                        {d.division}: {d.count}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
