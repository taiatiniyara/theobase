import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { orgApi } from "../lib/api";

interface Conference {
  id: number;
  name: string;
  code: string;
  address?: string;
  bank_details?: string;
}

interface District {
  id: number;
  name: string;
  pastor_email?: string;
}

interface Church {
  id: number;
  name: string;
  type: string;
  code?: string;
  district_name?: string;
}

export default function OrgManagementPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"conference" | "districts" | "churches" | "bulkChurches">(
    "conference"
  );
  const [conference, setConference] = useState<Conference | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const conferenceId = user?.conference?.id;

  const loadData = useCallback(async () => {
    if (!conferenceId) return;
    setLoading(true);
    try {
      const [confData] = await orgApi
        .getConferences()
        .then((d) => d.conferences.filter((c) => c.id === conferenceId));
      setConference(confData || null);
      const distData = await orgApi.getDistricts(conferenceId);
      setDistricts(distData.districts);
      const churchData = await orgApi.getChurches(conferenceId);
      setChurches(churchData.churches);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Conference edit
  async function handleUpdateConference(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!conferenceId) return;
    const form = new FormData(e.currentTarget);
    try {
      await orgApi.updateConference(conferenceId, {
        name: form.get("name"),
        address: form.get("address"),
        bankDetails: form.get("bankDetails"),
      });
      setMessage("Conference updated");
      loadData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Update failed";
      setMessage(msg);
    }
  }

  // District
  async function handleCreateDistrict(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!conferenceId) return;
    const form = new FormData(e.currentTarget);
    try {
      await orgApi.createDistrict(conferenceId, {
        name: form.get("name") as string,
      });
      setMessage("District created");
      loadData();
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed";
      setMessage(msg);
    }
  }

  // Church
  async function handleCreateChurch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!conferenceId) return;
    const form = new FormData(e.currentTarget);
    try {
      await orgApi.createChurch({
        name: form.get("name") as string,
        type: form.get("type") as string,
        parentId: conferenceId,
        parentType: "conference",
        districtId: form.get("districtId") ? Number(form.get("districtId")) : undefined,
        address: form.get("address") as string,
      });
      setMessage("Church created");
      loadData();
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed";
      setMessage(msg);
    }
  }

  // Bulk churches
  async function handleBulkChurches(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!conferenceId) return;
    const form = new FormData(e.currentTarget);
    const csv = form.get("csv") as string;
    try {
      const result = await orgApi.bulkCreateChurches(conferenceId, csv);
      setMessage(`Created ${(result as { created: unknown[] }).created.length} churches`);
      loadData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed";
      setMessage(msg);
    }
  }

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading...</div>;
  }

  if (!user?.conference) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Organization</h2>
        <p className="mt-4 text-gray-600">No Conference associated with your account.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Organization Management</h2>
      {message && (
        <div className="mt-4 rounded bg-blue-50 p-3 text-sm text-blue-600">{message}</div>
      )}

      <div className="mt-4 flex space-x-1 border-b border-gray-200">
        {(["conference", "districts", "churches", "bulkChurches"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t
                ? "border-b-2 border-orange-500 text-orange-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "conference"
              ? "Conference"
              : t === "districts"
                ? "Districts"
                : t === "churches"
                  ? "Churches"
                  : "Import"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "conference" && conference && (
          <div className="max-w-lg rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-gray-900">Edit Conference</h3>
            <form onSubmit={handleUpdateConference} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  name="name"
                  defaultValue={conference.name}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Code</label>
                <input
                  value={conference.code}
                  disabled
                  className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  name="address"
                  defaultValue={conference.address || ""}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Details</label>
                <textarea
                  name="bankDetails"
                  defaultValue={conference.bank_details || ""}
                  rows={2}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <button
                type="submit"
                className="rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
              >
                Save Changes
              </button>
            </form>
          </div>
        )}

        {tab === "districts" && (
          <div className="space-y-6">
            <div className="max-w-lg rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900">Create District</h3>
              <form onSubmit={handleCreateDistrict} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    name="name"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
                >
                  Create District
                </button>
              </form>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900">Districts ({districts.length})</h3>
              {districts.length === 0 ? (
                <p className="mt-2 text-gray-500">No districts yet.</p>
              ) : (
                <div className="mt-4 divide-y">
                  {districts.map((d) => (
                    <div key={d.id} className="flex items-center justify-between py-2">
                      <span className="font-medium text-gray-900">{d.name}</span>
                      {d.pastor_email && (
                        <span className="text-sm text-gray-500">{d.pastor_email}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "churches" && (
          <div className="space-y-6">
            <div className="max-w-lg rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900">Create Church</h3>
              <form onSubmit={handleCreateChurch} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    name="name"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    name="type"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="organized">Organized Church</option>
                    <option value="company">Company</option>
                    <option value="branch">Branch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">District</label>
                  <select
                    name="districtId"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">None</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    name="address"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
                >
                  Create Church
                </button>
              </form>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900">Churches ({churches.length})</h3>
              {churches.length === 0 ? (
                <p className="mt-2 text-gray-500">No churches yet.</p>
              ) : (
                <div className="mt-4 divide-y">
                  {churches.map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-2">
                      <div>
                        <span className="font-medium text-gray-900">{c.name}</span>
                        <span className="ml-2 text-xs capitalize text-gray-500">({c.type})</span>
                      </div>
                      {c.district_name && (
                        <span className="text-sm text-gray-500">{c.district_name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "bulkChurches" && (
          <div className="max-w-lg rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-gray-900">Bulk Import Churches</h3>
            <p className="mt-1 text-sm text-gray-500">
              Paste CSV with columns: name, type, district
            </p>
            <form onSubmit={handleBulkChurches} className="mt-4 space-y-4">
              <textarea
                name="csv"
                required
                rows={8}
                placeholder="name,type,district&#10;Central SDA Church,organized,Central District&#10;Riverside Company,company,Central District"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <button
                type="submit"
                className="rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
              >
                Import Churches
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
