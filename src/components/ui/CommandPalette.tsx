import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  Home,
  Users,
  DollarSign,
  CheckSquare,
  FileText,
  Building2,
  Shield,
  Settings,
  BarChart3,
  ArrowLeftRight,
  Gift,
  CreditCard,
  Globe,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  icon: ReactNode;
  to?: string;
  action?: () => void;
}

const COMMANDS: CommandItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <Home className="h-4 w-4" />, to: "/app" },
  { id: "members", label: "Members", icon: <Users className="h-4 w-4" />, to: "/app/members" },
  { id: "finance", label: "Finance", icon: <DollarSign className="h-4 w-4" />, to: "/app/finance" },
  {
    id: "attendance",
    label: "Attendance",
    icon: <CheckSquare className="h-4 w-4" />,
    to: "/app/attendance",
  },
  { id: "reports", label: "Reports", icon: <FileText className="h-4 w-4" />, to: "/app/reports" },
  {
    id: "organization",
    label: "Organization",
    icon: <Building2 className="h-4 w-4" />,
    to: "/app/organization",
  },
  { id: "users", label: "Users", icon: <Users className="h-4 w-4" />, to: "/app/users" },
  { id: "audit", label: "Audit Log", icon: <Shield className="h-4 w-4" />, to: "/app/audit" },
  {
    id: "reconciliation",
    label: "Reconciliation",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    to: "/app/reconciliation",
  },
  {
    id: "contributions",
    label: "Contributions",
    icon: <Gift className="h-4 w-4" />,
    to: "/app/contributions",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="h-4 w-4" />,
    to: "/app/settings",
  },
  {
    id: "billing",
    label: "Billing",
    icon: <CreditCard className="h-4 w-4" />,
    to: "/app/admin/billing",
  },
  {
    id: "conference",
    label: "Conference Dashboard",
    icon: <BarChart3 className="h-4 w-4" />,
    to: "/app/conference",
  },
  {
    id: "global",
    label: "Global Dashboard",
    icon: <Globe className="h-4 w-4" />,
    to: "/app/global",
  },
];

const RECENT_KEY = "theobase-command-recent";
const MAX_RECENT = 5;

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function addRecent(id: string) {
  const recent = getRecent().filter((r) => r !== id);
  recent.unshift(id);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = COMMANDS.filter(
    (c) => !query || c.label.toLowerCase().includes(query.toLowerCase())
  );

  const recentIds = getRecent();
  const sorted = [...filtered].sort((a, b) => {
    const aRecent = recentIds.indexOf(a.id);
    const bRecent = recentIds.indexOf(b.id);
    if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent;
    if (aRecent !== -1) return -1;
    if (bRecent !== -1) return 1;
    return 0;
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (!open) return;
      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, sorted.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        const item = sorted[selectedIndex];
        if (item) {
          e.preventDefault();
          addRecent(item.id);
          setOpen(false);
          if (item.action) {
            item.action();
          } else if (item.to) {
            navigate({ to: item.to });
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, sorted, selectedIndex]
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center border-b border-gray-200 px-4 py-3">
          <Search className="mr-2 h-4 w-4 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages..."
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
          />
          <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
            ESC
          </kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {sorted.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-gray-500">No results</p>
          ) : (
            sorted.map((item, i) => (
              <button
                key={item.id}
                onClick={() => {
                  addRecent(item.id);
                  setOpen(false);
                  if (item.action) item.action();
                  else if (item.to) navigate({ to: item.to });
                }}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  i === selectedIndex
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center text-gray-500">
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {recentIds.includes(item.id) && (
                  <span className="text-[10px] text-gray-400">Recent</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
