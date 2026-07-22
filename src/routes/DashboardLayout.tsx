import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../lib/auth";
import { notificationApi, type Notification } from "../lib/api";
import { getVisibleGroups } from "../lib/modules";
import SyncIndicator from "./SyncIndicator";
import ConflictResolver from "./ConflictResolver";

const ICONS: Record<string, ReactNode> = {
  home: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  building: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  ),
  users: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  currency: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  person: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  chart: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  cog: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  shield: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  ),
  bell: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  ),
  menu: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  chevron: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationApi.getNotifications(true);
      setUnreadCount(data.notifications.filter((n) => !n.read).length);
      if (notifOpen) {
        const all = await notificationApi.getNotifications();
        setNotifications(all.notifications);
      }
    } catch {
      // ignore
    }
  }, [notifOpen]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest("[data-notif-menu]")) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest("[data-user-menu]")) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate({ to: "/login" });
  }, [logout, navigate]);

  const role = user?.role ?? "member";
  const visibleGroups = getVisibleGroups(role);

  function renderSidebar() {
    return (
      <aside className="flex h-full w-64 flex-col bg-gray-900 text-white">
        <div className="flex items-center justify-between border-b border-gray-700 p-4">
          <Link to="/app" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <img src="/logo-light.svg" alt="Theobase" className="h-8 w-auto" />
          </Link>
          <button
            className="rounded p-1 hover:bg-gray-800 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            {ICONS.close}
          </button>
        </div>
        {user?.conference && (
          <div className="border-b border-gray-700 px-4 py-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {user.conference.name}
            </p>
            {user?.church && <p className="text-xs text-gray-500">{user.church.name}</p>}
          </div>
        )}
        <nav className="flex-1 space-y-4 overflow-y-auto p-2">
          {visibleGroups.map((group) => (
            <div key={group.id}>
              {group.label && (
                <div className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase">
                  {group.label}
                </div>
              )}
              <div className="space-y-1">
                {group.items
                  .filter((item) => item.roles.includes(role))
                  .map((item) => (
                    <Link
                      key={item.id}
                      to={item.path}
                      className="flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors hover:bg-gray-800 [&.active]:bg-gray-800 [&.active]:text-brand"
                      onClick={() => setSidebarOpen(false)}
                    >
                      {ICONS[item.icon]}
                      {item.label}
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-gray-700 p-2 md:hidden">
          <button
            onClick={handleLogout}
            className="block w-full rounded px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Sign Out
          </button>
        </div>
      </aside>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop: static, mobile: overlay */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderSidebar()}
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="rounded p-1 text-gray-600 hover:bg-gray-100 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              {ICONS.menu}
            </button>
            <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">Theobase</h1>
          </div>

          <div className="flex items-center gap-2">
            <SyncIndicator />

            {/* Notification bell */}
            <div className="relative" data-notif-menu>
              <button
                className="relative rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Notifications"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  if (!notifOpen) {
                    notificationApi
                      .getNotifications()
                      .then((d) => setNotifications(d.notifications))
                      .catch(() => {});
                  }
                }}
              >
                {ICONS.bell}
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
                    <span className="text-sm font-medium text-gray-900">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={async () => {
                          await notificationApi.markAllRead();
                          setUnreadCount(0);
                          setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
                        }}
                        className="text-xs text-brand hover:text-orange-600"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-500">No notifications</p>
                    ) : (
                      notifications.slice(0, 20).map((n) => (
                        <div
                          key={n.id}
                          className={`flex items-start gap-2 px-4 py-2 text-sm hover:bg-gray-50 ${
                            !n.read ? "bg-orange-50" : ""
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 truncate">{n.message}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(n.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {!n.read && (
                            <button
                              onClick={async () => {
                                await notificationApi.markRead(n.id);
                                setNotifications((prev) =>
                                  prev.map((x) => (x.id === n.id ? { ...x, read: 1 } : x))
                                );
                                setUnreadCount((c) => c - 1);
                              }}
                              className="shrink-0 text-xs text-brand hover:text-orange-600"
                            >
                              Read
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative" data-user-menu>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-100"
                aria-label="User menu"
                aria-expanded={userMenuOpen}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{role}</p>
                </div>
                <span
                  className={`hidden sm:block transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                >
                  {ICONS.chevron}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <div className="border-b border-gray-100 px-4 py-2 sm:hidden">
                    <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{role}</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate({ to: "/app/settings" });
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {ICONS.cog}
                    Settings
                  </button>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
      <ConflictResolver />
    </div>
  );
}
