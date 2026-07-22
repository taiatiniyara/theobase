import { useAuth } from "../lib/auth";
import { useState } from "react";
import { api } from "../lib/api";

export default function SettingsPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const currentPassword = (form.elements.namedItem("currentPassword") as HTMLInputElement).value;
    const newPassword = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.");
      return;
    }

    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setMessage("Password changed successfully.");
      form.reset();
    } catch (err: unknown) {
      const e = err as { error?: string };
      setMessage(e.error || "Failed to change password.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      <div className="mt-6 space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">Profile</h3>
          <div className="mt-4 grid gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-500">Email</span>
              <p className="mt-0.5 text-gray-900">{user?.email}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Role</span>
              <p className="mt-0.5 text-gray-900 capitalize">{user?.role}</p>
            </div>
            {user?.conference && (
              <div>
                <span className="font-medium text-gray-500">Conference</span>
                <p className="mt-0.5 text-gray-900">{user.conference.name}</p>
              </div>
            )}
            {user?.church && (
              <div>
                <span className="font-medium text-gray-500">Church</span>
                <p className="mt-0.5 text-gray-900">{user.church.name}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
          <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                required
                minLength={8}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                required
                minLength={8}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                minLength={8}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            {message && (
              <p
                className={`text-sm ${message.includes("Success") ? "text-green-600" : "text-red-600"}`}
              >
                {message}
              </p>
            )}
            <button
              type="submit"
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
