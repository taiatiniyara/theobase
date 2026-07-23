import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import {
  selfMemberApi,
  givingApi,
  financeApi,
  declarationApi,
  memberApi,
  type Fund,
  type Member,
  type GivingDeclaration,
} from "../lib/api";

export default function MemberDashboardPage() {
  const { user } = useAuth();

  const [tab, setTab] = useState<"profile" | "giving" | "transfers">("profile");
  const [profile, setProfile] = useState<{
    id: number;
    church_id: number;
    full_name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    version: number;
  } | null>(null);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [declarations, setDeclarations] = useState<GivingDeclaration[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [proxyMode, setProxyMode] = useState(false);
  const [proxyMemberId, setProxyMemberId] = useState<number | null>(null);

  const churchId = user?.church?.id;

  const loadProfile = useCallback(async () => {
    if (!churchId) return;
    try {
      const data = await selfMemberApi.getMe(churchId);
      setProfile(data);
    } catch {
      setMessage("Unable to load your profile. Ensure your account is linked to a member record.");
    }
  }, [churchId]);

  const loadFunds = useCallback(async () => {
    if (!user?.conference?.id) return;
    try {
      const data = await financeApi.getFunds(user.conference.id);
      setFunds(data.funds);
    } catch {
      // silent
    }
  }, [user?.conference?.id]);

  const loadMembers = useCallback(async () => {
    if (!churchId) return;
    try {
      const data = await memberApi.getMembers({
        church_id: churchId,
        status: "active",
      });
      setMembers(data.members);
    } catch {
      // silent
    }
  }, [churchId]);

  const loadDeclarations = useCallback(async () => {
    if (!churchId) return;
    try {
      const data = await declarationApi.list(churchId);
      setDeclarations(data.declarations);
    } catch {
      // silent
    }
  }, [churchId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadProfile(), loadFunds(), loadMembers(), loadDeclarations()]).finally(() =>
      setLoading(false)
    );
  }, [loadProfile, loadFunds, loadMembers, loadDeclarations]);

  async function handleUpdateProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!churchId || !profile) return;
    const form = new FormData(e.currentTarget);
    const body: {
      fullName?: string;
      phone?: string;
      email?: string;
      address?: string;
      version: number;
    } = {
      version: profile.version,
    };
    const fn = form.get("fullName") as string;
    if (fn && fn !== profile.full_name) body.fullName = fn;
    const phone = form.get("phone") as string;
    if (phone !== (profile.phone ?? "")) body.phone = phone;
    const email = form.get("email") as string;
    if (email !== (profile.email ?? "")) body.email = email;
    const address = form.get("address") as string;
    if (address !== (profile.address ?? "")) body.address = address;

    try {
      await selfMemberApi.updateMe(churchId, body);
      setMessage("Profile updated");
      loadProfile();
    } catch (err: unknown) {
      setMessage(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Update failed"
      );
    }
  }

  async function handleGivingDeclaration(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!churchId || !profile) return;
    const form = new FormData(e.currentTarget);
    const fundId = Number(form.get("fundId"));
    const amount = Number(form.get("amount"));
    const description = (form.get("description") as string) || undefined;

    if (!fundId || !amount) {
      setMessage("Fund and amount are required");
      return;
    }

    try {
      const targetMemberId = proxyMode && proxyMemberId ? proxyMemberId : profile.id;
      const result = await givingApi.declare(churchId, targetMemberId, {
        fundId,
        amount,
        description,
        proxyForMemberId: proxyMode ? profile.id : undefined,
      });
      setMessage(
        `Giving declaration recorded: $${amount.toFixed(2)} to ${result.fundType} (pending verification)`
      );
      (e.target as HTMLFormElement).reset();
      setProxyMode(false);
      setProxyMemberId(null);
      loadDeclarations();
    } catch (err: unknown) {
      setMessage(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Declaration failed"
      );
    }
  }

  async function handleTransferRequest(toChurchId: number) {
    if (!churchId || !profile) return;
    try {
      await givingApi.requestTransfer(churchId, profile.id, toChurchId);
      setMessage("Transfer request submitted. The conference secretary will review it.");
    } catch (err: unknown) {
      setMessage(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Transfer request failed"
      );
    }
  }

  if (!user?.church) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
        <p className="mt-4 text-gray-600">
          No church associated with your account. Contact your conference administrator.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>

      {message && (
        <div className="mt-4 rounded bg-blue-50 p-3 text-sm text-blue-600">{message}</div>
      )}

      {loading ? (
        <p className="mt-6 text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="mt-4 flex space-x-1 border-b border-gray-200">
            {(["profile", "giving", "transfers"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setMessage("");
                }}
                className={`px-4 py-2 text-sm font-medium ${
                  tab === t
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "profile" ? "My Profile" : t === "giving" ? "Give" : "Transfer"}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {tab === "profile" && profile && (
              <div className="max-w-lg rounded-lg bg-white p-6 shadow">
                <h3 className="text-lg font-medium text-gray-900">Edit Profile</h3>
                <form onSubmit={handleUpdateProfile} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      name="fullName"
                      defaultValue={profile.full_name}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      name="phone"
                      defaultValue={profile.phone ?? ""}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      name="email"
                      type="email"
                      defaultValue={profile.email ?? ""}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input
                      name="address"
                      defaultValue={profile.address ?? ""}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
                  >
                    Save
                  </button>
                </form>
              </div>
            )}

            {tab === "giving" && profile && (
              <div className="max-w-lg rounded-lg bg-white p-6 shadow">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Giving Declaration</h3>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={proxyMode}
                      onChange={(e) => {
                        setProxyMode(e.target.checked);
                        if (!e.target.checked) setProxyMemberId(null);
                      }}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    Entering for another member
                  </label>
                </div>

                {proxyMode && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700">Member</label>
                    <select
                      value={proxyMemberId ?? ""}
                      onChange={(e) =>
                        setProxyMemberId(e.target.value ? Number(e.target.value) : null)
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="">Select a member...</option>
                      {members
                        .filter((m) => m.id !== profile.id)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <form onSubmit={handleGivingDeclaration} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fund *</label>
                    <select
                      name="fundId"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="">Select fund...</option>
                      {funds.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} (
                          {f.type === "tithe"
                            ? "Tithe"
                            : f.type === "sabbath_school"
                              ? "Sabbath School"
                              : "Offering"}
                          )
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount ($) *</label>
                    <input
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Note (optional)
                    </label>
                    <input
                      name="description"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
                  >
                    Submit Declaration
                  </button>
                </form>

                {declarations.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700">My Declarations</h4>
                    <div className="mt-2 space-y-2">
                      {declarations
                        .filter(
                          (d) => d.member_id === profile.id || d.proxy_for_member_id === profile.id
                        )
                        .slice(0, 10)
                        .map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between rounded border border-gray-200 p-2 text-sm"
                          >
                            <div>
                              <span className="font-medium text-gray-900">
                                ${d.amount.toFixed(2)}
                              </span>{" "}
                              <span className="text-gray-500">{d.fund_name}</span>
                              {d.proxy_for_member_id && (
                                <span className="ml-1 text-xs text-orange-500">
                                  via {d.proxy_for_name ?? "proxy"}
                                </span>
                              )}
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                d.verified
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {d.verified ? "Verified" : "Pending"}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "transfers" && profile && (
              <div className="max-w-lg rounded-lg bg-white p-6 shadow">
                <h3 className="text-lg font-medium text-gray-900">Transfer Request</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Request a transfer from {user.church?.name ?? "your church"} to another church.
                  The conference secretary will review your request.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    const toChurchId = Number(form.get("toChurchId"));
                    if (toChurchId) handleTransferRequest(toChurchId);
                  }}
                  className="mt-4 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Destination Church ID
                    </label>
                    <input
                      name="toChurchId"
                      type="number"
                      required
                      placeholder="Enter church ID"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
                  >
                    Request Transfer
                  </button>
                </form>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
