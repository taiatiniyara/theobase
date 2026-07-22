import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../lib/auth";

const ROLE_DEFAULTS: Record<string, string> = {
  treasurer: "/app/finance",
  secretary: "/app/members",
  pastor: "/app/members",
  auditor: "/app/audit",
  president: "/app/reports",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role && ROLE_DEFAULTS[user.role]) {
      navigate({ to: ROLE_DEFAULTS[user.role]!, replace: true });
    }
  }, [user, navigate]);

  if (user?.role && ROLE_DEFAULTS[user.role]) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Role</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900 capitalize">{user?.role}</p>
        </div>
        {user?.conference && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Conference</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900">{user.conference.name}</p>
          </div>
        )}
        {user?.church && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Church</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900">{user.church.name}</p>
          </div>
        )}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Email</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">{user?.email}</p>
        </div>
      </div>
      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-medium text-gray-900">Welcome to Theobase</h3>
        <p className="mt-2 text-gray-600">
          The Seventh-day Adventist Church Administration Platform. Use the sidebar to navigate to
          organization management, membership records, and financial reports.
        </p>
      </div>
    </div>
  );
}
