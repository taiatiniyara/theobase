import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import {
  memberApi,
  orgApi,
  type Member,
  type Household,
  type Position,
  type Transfer,
} from "../lib/api";

export default function MembersPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"list" | "create" | "households" | "positions" | "transfers">(
    "list"
  );
  const [members, setMembers] = useState<Member[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [churches, setChurches] = useState<{ id: number; name: string }[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rejectTransferId, setRejectTransferId] = useState<number | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");

  const conferenceId = user?.conference?.id;

  const loadMembers = useCallback(async () => {
    if (!conferenceId) return;
    setLoading(true);
    try {
      const data = await memberApi.getMembers({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setMembers(data.members);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [conferenceId, search, statusFilter]);

  const loadHouseholds = useCallback(async () => {
    if (!conferenceId) return;
    try {
      const data = await memberApi.getHouseholds();
      setHouseholds(data.households);
    } catch {
      // ignore
    }
  }, [conferenceId]);

  const loadPositions = useCallback(async () => {
    try {
      const data = await memberApi.getPositions();
      setPositions(data.positions);
    } catch {
      // ignore
    }
  }, []);

  const loadTransfers = useCallback(async () => {
    if (!conferenceId) return;
    try {
      const data = await memberApi.getTransfers();
      setTransfers(data.transfers);
    } catch {
      // ignore
    }
  }, [conferenceId]);

  const loadChurches = useCallback(async () => {
    if (!conferenceId) return;
    try {
      const data = await orgApi.getChurches(conferenceId);
      setChurches(data.churches.map((c) => ({ id: c.id, name: c.name })));
    } catch {
      // ignore
    }
  }, [conferenceId]);

  useEffect(() => {
    loadMembers();
    loadChurches();
  }, [loadMembers, loadChurches]);

  useEffect(() => {
    if (tab === "households") loadHouseholds();
    if (tab === "positions") loadPositions();
    if (tab === "transfers") loadTransfers();
  }, [tab, loadHouseholds, loadPositions, loadTransfers]);

  // ── Create Member ──
  async function handleCreateMember(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const churchId = Number(form.get("churchId"));
    try {
      await memberApi.createMember({
        churchId,
        fullName: form.get("fullName") as string,
        preferredName: (form.get("preferredName") as string) || undefined,
        dob: (form.get("dob") as string) || undefined,
        gender: (form.get("gender") as string) || undefined,
        baptismDate: (form.get("baptismDate") as string) || undefined,
        baptismType: (form.get("baptismType") as string) || undefined,
        joinDate: (form.get("joinDate") as string) || undefined,
        phone: (form.get("phone") as string) || undefined,
        email: (form.get("email") as string) || undefined,
        address: (form.get("address") as string) || undefined,
        maritalStatus: (form.get("maritalStatus") as string) || undefined,
        householdId: form.get("householdId") ? Number(form.get("householdId")) : undefined,
      });
      setMessage("Member created");
      loadMembers();
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed";
      setMessage(msg);
    }
  }

  // ── Remove Member ──
  async function handleRemove(memberId: number, reason: string) {
    try {
      await memberApi.removeMember(memberId, { reason });
      setMessage("Member removed");
      loadMembers();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed";
      setMessage(msg);
    }
  }

  // ── Create Household ──
  async function handleCreateHousehold(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const churchId = Number(form.get("churchId"));
    try {
      await memberApi.createHousehold({
        churchId,
        name: form.get("name") as string,
        address: (form.get("address") as string) || undefined,
        headMemberId: form.get("headMemberId") ? Number(form.get("headMemberId")) : undefined,
      });
      setMessage("Household created");
      loadHouseholds();
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed";
      setMessage(msg);
    }
  }

  // ── Create Position ──
  async function handleCreatePosition(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await memberApi.createPosition({ name: form.get("name") as string });
      setMessage("Position created");
      loadPositions();
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed";
      setMessage(msg);
    }
  }

  // ── Initiate Transfer ──
  async function handleInitiateTransfer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await memberApi.initiateTransfer({
        memberId: Number(form.get("memberId")),
        toChurchId: Number(form.get("toChurchId")),
      });
      setMessage("Transfer initiated");
      loadTransfers();
      loadMembers();
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed";
      setMessage(msg);
    }
  }

  // ── Transfer Actions ──
  async function handleTransferAction(id: number, action: "approve" | "accept" | "reject") {
    try {
      if (action === "approve") await memberApi.approveTransfer(id);
      else if (action === "accept") await memberApi.acceptTransfer(id);
      else {
        await memberApi.rejectTransfer(id, rejectionNote || undefined);
        setRejectTransferId(null);
        setRejectionNote("");
      }
      setMessage(`Transfer ${action}ed`);
      loadTransfers();
      loadMembers();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed";
      setMessage(msg);
    }
  }

  if (!user?.conference) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Members</h2>
        <p className="mt-4 text-gray-600">No Conference associated with your account.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Membership Management</h2>
      {message && (
        <div className="mt-4 rounded bg-blue-50 p-3 text-sm text-blue-600">{message}</div>
      )}

      <div className="mt-4 flex space-x-1 border-b border-gray-200">
        {(["list", "create", "households", "positions", "transfers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t
                ? "border-b-2 border-orange-500 text-orange-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "list"
              ? "Members"
              : t === "create"
                ? "Add Member"
                : t === "households"
                  ? "Households"
                  : t === "positions"
                    ? "Positions"
                    : "Transfers"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {/* ── Member List ── */}
        {tab === "list" && (
          <div>
            <div className="mb-4 flex gap-4">
              <input
                type="text"
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="transferred">Transferred</option>
                <option value="deceased">Deceased</option>
                <option value="removed">Removed</option>
              </select>
              <button
                onClick={loadMembers}
                className="rounded-md bg-orange-500 px-3 py-2 text-sm text-white hover:bg-orange-600"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : members.length === 0 ? (
              <p className="text-gray-500">No members found.</p>
            ) : (
              <div className="rounded-lg bg-white shadow">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 font-medium text-gray-700">Name</th>
                      <th className="px-4 py-2 font-medium text-gray-700">Email</th>
                      <th className="px-4 py-2 font-medium text-gray-700">Phone</th>
                      <th className="px-4 py-2 font-medium text-gray-700">Status</th>
                      <th className="px-4 py-2 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <button
                            onClick={() => setSelectedMember(m)}
                            className="font-medium text-orange-600 hover:text-orange-800"
                          >
                            {m.full_name}
                          </button>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{m.email || "-"}</td>
                        <td className="px-4 py-2 text-gray-600">{m.phone || "-"}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              m.status === "active"
                                ? "bg-green-100 text-green-700"
                                : m.status === "transferred"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="space-x-1 px-4 py-2">
                          {m.status === "active" && (
                            <>
                              <button
                                onClick={() => handleRemove(m.id, "deceased")}
                                className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-200"
                              >
                                Deceased
                              </button>
                              <button
                                onClick={() => handleRemove(m.id, "missing")}
                                className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-200"
                              >
                                Missing
                              </button>
                              <button
                                onClick={() => handleRemove(m.id, "apostasy")}
                                className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-200"
                              >
                                Apostasy
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Member Detail ── */}
            {selectedMember && (
              <div className="mt-6 rounded-lg bg-white p-6 shadow">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{selectedMember.full_name}</h3>
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Gender:</span>{" "}
                    {selectedMember.gender || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">DOB:</span>{" "}
                    {selectedMember.dob || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>{" "}
                    {selectedMember.email || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>{" "}
                    {selectedMember.phone || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Baptism:</span>{" "}
                    {selectedMember.baptism_date
                      ? `${selectedMember.baptism_date} (${selectedMember.baptism_type})`
                      : "-"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Joined:</span>{" "}
                    {selectedMember.join_date || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>{" "}
                    <span className="capitalize">{selectedMember.status}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Version:</span>{" "}
                    {selectedMember.version}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Add Member ── */}
        {tab === "create" && (
          <div className="max-w-lg rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-gray-900">Add New Member</h3>
            <form onSubmit={handleCreateMember} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  name="fullName"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred Name</label>
                <input
                  name="preferredName"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Church *</label>
                <select
                  name="churchId"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Select church</option>
                  {churches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    name="gender"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input
                    name="dob"
                    type="date"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Baptism Date</label>
                  <input
                    name="baptismDate"
                    type="date"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Baptism Type</label>
                  <select
                    name="baptismType"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Select</option>
                    <option value="immersion">Immersion</option>
                    <option value="profession_of_faith">Profession of Faith</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Join Date</label>
                <input
                  name="joinDate"
                  type="date"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Marital Status</label>
                <select
                  name="maritalStatus"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Select</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="widowed">Widowed</option>
                  <option value="divorced">Divorced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  name="email"
                  type="email"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  name="phone"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  name="address"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Household</label>
                <select
                  name="householdId"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">None</option>
                  {households.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
              >
                Create Member
              </button>
            </form>
          </div>
        )}

        {/* ── Households ── */}
        {tab === "households" && (
          <div className="space-y-6">
            <div className="max-w-lg rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900">Create Household</h3>
              <form onSubmit={handleCreateHousehold} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Church *</label>
                  <select
                    name="churchId"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Select church</option>
                    {churches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Household Name *
                  </label>
                  <input
                    name="name"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
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
                  Create Household
                </button>
              </form>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900">
                Households ({households.length})
              </h3>
              {households.length === 0 ? (
                <p className="mt-2 text-gray-500">No households yet.</p>
              ) : (
                <div className="mt-4 divide-y">
                  {households.map((h) => (
                    <div key={h.id} className="flex items-center justify-between py-2">
                      <div>
                        <span className="font-medium text-gray-900">{h.name}</span>
                        {h.head_member_name && (
                          <span className="ml-2 text-sm text-gray-500">
                            Head: {h.head_member_name}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {h.member_count} member{h.member_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Positions ── */}
        {tab === "positions" && (
          <div className="space-y-6">
            <div className="max-w-lg rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900">Create Position</h3>
              <form onSubmit={handleCreatePosition} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Position Name *</label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Elder, Treasurer, Clerk, Deacon"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
                >
                  Create Position
                </button>
              </form>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900">Positions ({positions.length})</h3>
              {positions.length === 0 ? (
                <p className="mt-2 text-gray-500">No positions defined yet.</p>
              ) : (
                <div className="mt-4 divide-y">
                  {positions.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2">
                      <span className="font-medium text-gray-900">{p.name}</span>
                      <span className="text-xs text-gray-500 uppercase">{p.module}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Transfers ── */}
        {tab === "transfers" && (
          <div className="space-y-6">
            <div className="max-w-lg rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900">Initiate Transfer</h3>
              <form onSubmit={handleInitiateTransfer} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Member *</label>
                  <select
                    name="memberId"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Select member</option>
                    {members
                      .filter((m) => m.status === "active")
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Destination Church *
                  </label>
                  <select
                    name="toChurchId"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Select church</option>
                    {churches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
                >
                  Initiate Transfer
                </button>
              </form>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900">Transfers ({transfers.length})</h3>
              {transfers.length === 0 ? (
                <p className="mt-2 text-gray-500">No transfers yet.</p>
              ) : (
                <div className="mt-4 divide-y">
                  {transfers.map((t) => (
                    <div key={t.id} className="space-y-2 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">{t.member_name}</span>
                          <span className="ml-2 text-sm text-gray-500">
                            {t.from_church_name} → {t.to_church_name}
                          </span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            t.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : t.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {t.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Initiated: {new Date(t.initiated_at).toLocaleDateString()}
                        {t.rejection_note && (
                          <span className="ml-2 text-red-500">Note: {t.rejection_note}</span>
                        )}
                      </div>
                      {rejectTransferId === t.id && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={rejectionNote}
                            onChange={(e) => setRejectionNote(e.target.value)}
                            placeholder="Reason for rejection (optional)"
                            className="mr-2 rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                          <button
                            onClick={() => handleTransferAction(t.id, "reject")}
                            className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => {
                              setRejectTransferId(null);
                              setRejectionNote("");
                            }}
                            className="ml-1 rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {rejectTransferId !== t.id && (
                        <div className="space-x-2">
                          {t.status === "pending_conference" && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    const detail = await memberApi.getMember(t.member_id);
                                    setSelectedMember(detail as unknown as Member);
                                  } catch {
                                    /* ignore */
                                  }
                                }}
                                className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-200"
                              >
                                Review Member
                              </button>
                              <button
                                onClick={() => handleTransferAction(t.id, "approve")}
                                className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700 hover:bg-green-200"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setRejectTransferId(t.id);
                                  setRejectionNote("");
                                }}
                                className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700 hover:bg-red-200"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {t.status === "pending_destination" && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    const detail = await memberApi.getMember(t.member_id);
                                    setSelectedMember(detail as unknown as Member);
                                  } catch {
                                    /* ignore */
                                  }
                                }}
                                className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-200"
                              >
                                Review Member
                              </button>
                              <button
                                onClick={() => handleTransferAction(t.id, "accept")}
                                className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700 hover:bg-green-200"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => {
                                  setRejectTransferId(t.id);
                                  setRejectionNote("");
                                }}
                                className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700 hover:bg-red-200"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      {selectedMember && selectedMember.id === t.member_id && (
                        <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-3 text-xs">
                          <p>
                            <strong>{selectedMember.full_name}</strong>
                          </p>
                          {selectedMember.gender && <p>Gender: {selectedMember.gender}</p>}
                          {selectedMember.dob && <p>DOB: {selectedMember.dob}</p>}
                          {selectedMember.email && <p>Email: {selectedMember.email}</p>}
                          {selectedMember.phone && <p>Phone: {selectedMember.phone}</p>}
                          {selectedMember.baptism_date && (
                            <p>
                              Baptized: {selectedMember.baptism_date}
                              {selectedMember.baptism_type && ` (${selectedMember.baptism_type})`}
                            </p>
                          )}
                          <button
                            onClick={() => setSelectedMember(null)}
                            className="mt-1 text-gray-500 hover:text-gray-700"
                          >
                            Hide
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
