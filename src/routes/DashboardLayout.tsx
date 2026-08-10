import { useState, useEffect, useCallback } from "react";
import { Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../lib/auth";
import { notificationApi, type Notification } from "../lib/api";
import { getVisibleGroups } from "../lib/modules";
import { getBreadcrumbs } from "../lib/useBreadcrumbs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator } from "../components/ui/Breadcrumb";
import SyncIndicator from "./SyncIndicator";
import ConflictResolver from "./ConflictResolver";
import { CommandPalette } from "../components/ui/CommandPalette";
import {
  Home,
  Building2,
  Users,
  DollarSign,
  User,
  BarChart3,
  Settings,
  Shield,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Moon,
  Sun,
} from "lucide-react";
import { useDarkMode } from "../lib/useDarkMode";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  building: Building2,
  users: Users,
  currency: DollarSign,
  person: User,
  chart: BarChart3,
  cog: Settings,
  shield: Shield,
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation("common");
  const { dark, toggle: toggleDark } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("theobase-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });
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
    const sidebarWidth = collapsed ? "w-16" : "w-64";
    return (
      <aside
        className={`flex h-full ${sidebarWidth} flex-col bg-gray-900 text-white transition-all duration-200`}
      >
        <div
          className={`flex items-center border-b border-gray-700 p-4 ${collapsed ? "justify-center" : "justify-between"}`}
        >
          {!collapsed && (
            <Link
              to="/app"
              className="flex items-center gap-2"
              onClick={() => setSidebarOpen(false)}
            >
              <img src="/logo-light.svg" alt="Theobase" className="h-8 w-auto" />
            </Link>
          )}
          {collapsed && (
            <Link to="/app" onClick={() => setSidebarOpen(false)}>
              <img src="/icon.svg" alt="Theobase" className="h-8 w-8" />
            </Link>
          )}
          <button
            className="rounded p-1 hover:bg-gray-800 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {!collapsed && user?.conference && (
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
              {!collapsed && group.label && (
                <div className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase">
                  {group.label}
                </div>
              )}
              <div className="space-y-1">
                {group.items
                  .filter((item) => item.roles.includes(role))
                  .map((item) => {
                    const Icon = ICON_MAP[item.icon];
                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        className={`flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors hover:bg-gray-800 [&.active]:bg-gray-800 [&.active]:text-brand ${collapsed ? "justify-center" : ""}`}
                        onClick={() => setSidebarOpen(false)}
                        title={collapsed ? item.label : undefined}
                      >
                        {Icon && <Icon className="h-5 w-5 shrink-0" />}
                        {!collapsed && item.label}
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>
        {/* Language switcher */}
        {!collapsed && (
          <div className="border-t border-gray-700 px-4 py-2">
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-300"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="pt">Português</option>
            </select>
          </div>
        )}
        {/* Collapse toggle */}
        <button
          onClick={() => {
            const next = !collapsed;
            setCollapsed(next);
            localStorage.setItem("theobase-sidebar-collapsed", String(next));
          }}
          className="hidden md:flex items-center justify-center border-t border-gray-700 p-3 text-gray-400 hover:bg-gray-800 hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
        <div className="border-t border-gray-700 p-2 md:hidden">
          <button
            onClick={handleLogout}
            className="block w-full rounded px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="mr-2 inline h-4 w-4" />
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
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-16" : "w-64"}`}
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
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">Theobase</h1>
            <div className="hidden sm:flex items-center text-gray-400 mx-1">|</div>
            <Breadcrumb>
              {getBreadcrumbs(location.pathname).map((crumb, i, arr) => (
                <span key={i} className="hidden sm:contents">
                  {crumb.to ? (
                    <BreadcrumbItem to={crumb.to}>{crumb.label}</BreadcrumbItem>
                  ) : (
                    <BreadcrumbItem isLast>{crumb.label}</BreadcrumbItem>
                  )}
                  {i < arr.length - 1 && <BreadcrumbSeparator />}
                </span>
              ))}
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <SyncIndicator />

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

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
                <Bell className="h-5 w-5" />
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
                  <ChevronDown
                    className={`${userMenuOpen ? "rotate-180" : ""} transition-transform`}
                  />
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
                    <Settings className="h-4 w-4" />
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
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6" id="main-content">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
      <ConflictResolver />
    </div>
  );
}
