import { Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../lib/auth";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-64 flex-col bg-gray-900 text-white">
        <div className="border-b border-gray-700 p-4">
          <img src="/logo-light.svg" alt="Theobase" className="h-8 w-auto" />
          {user?.conference && <p className="mt-1 text-sm text-gray-400">{user.conference.name}</p>}
          {user?.church && <p className="text-xs text-gray-500">{user.church.name}</p>}
        </div>
        <div className="border-b border-gray-700 px-4 py-2">
          <p className="text-sm text-gray-300">{user?.email}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          <Link
            to="/app"
            className="block rounded px-3 py-2 text-sm hover:bg-gray-800 [&.active]:bg-gray-800 [&.active]:text-brand"
          >
            Dashboard
          </Link>
          {(user?.role === "sysadmin" || user?.role === "secretary") && (
            <>
              <Link
                to="/app/organization"
                className="block rounded px-3 py-2 text-sm hover:bg-gray-800 [&.active]:bg-gray-800"
              >
                Organization
              </Link>
              <Link
                to="/app/users"
                className="block rounded px-3 py-2 text-sm hover:bg-gray-800 [&.active]:bg-gray-800"
              >
                Users
              </Link>
            </>
          )}
          {(user?.role === "treasurer" || user?.role === "sysadmin") && (
            <>
              <div className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase">
                Finance
              </div>
              <Link
                to="/app/finance"
                className="block rounded px-3 py-2 text-sm hover:bg-gray-800 [&.active]:bg-gray-800"
              >
                Finance
              </Link>
            </>
          )}
          {(user?.role === "secretary" || user?.role === "pastor" || user?.role === "sysadmin") && (
            <>
              <div className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase">
                Membership
              </div>
              <Link
                to="/app/members"
                className="block rounded px-3 py-2 text-sm hover:bg-gray-800 [&.active]:bg-gray-800"
              >
                Members
              </Link>
            </>
          )}
        </nav>
        <div className="border-t border-gray-700 p-2">
          <button
            onClick={handleLogout}
            className="block w-full rounded px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
