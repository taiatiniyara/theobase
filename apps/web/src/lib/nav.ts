import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
import User from "@lucide/svelte/icons/user";
import Receipt from "@lucide/svelte/icons/receipt";
import Gavel from "@lucide/svelte/icons/gavel";
import Landmark from "@lucide/svelte/icons/landmark";
import CalendarCheck from "@lucide/svelte/icons/calendar-check";
import Church from "@lucide/svelte/icons/church";
import Compass from "@lucide/svelte/icons/compass";
import HeartHandshake from "@lucide/svelte/icons/heart-handshake";
import GraduationCap from "@lucide/svelte/icons/graduation-cap";
import HeartPulse from "@lucide/svelte/icons/heart-pulse";
import Wine from "@lucide/svelte/icons/wine";
import MonitorPlay from "@lucide/svelte/icons/monitor-play";
import Building2 from "@lucide/svelte/icons/building-2";
import Building from "@lucide/svelte/icons/building";
import AlertTriangle from "@lucide/svelte/icons/alert-triangle";
import ArrowRightLeft from "@lucide/svelte/icons/arrow-right-left";
import Home from "@lucide/svelte/icons/house";
import ClipboardCheck from "@lucide/svelte/icons/clipboard-check";
import Vote from "@lucide/svelte/icons/vote";
import Presentation from "@lucide/svelte/icons/presentation";

import type { Component } from "svelte";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = Component<any>;

export interface NavItem {
  label: string;
  href: string;
  icon: IconComponent;
  roles?: string[];
}

export interface NavSection {
  label: string;
  icon: IconComponent;
  roles?: string[];
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [{ label: "Overview", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Member",
    icon: User,
    items: [
      { label: "Profile", href: "/me", icon: User },
      { label: "Giving", href: "/receipts", icon: Receipt },
    ],
  },
  {
    label: "Clerk",
    icon: ClipboardCheck,
    roles: ["clerk"],
    items: [
      { label: "Boardroom", href: "/boardroom", icon: Gavel },
      { label: "Duty Rota", href: "/rota", icon: CalendarCheck },
      { label: "Congregation", href: "/congregation", icon: Church },
      { label: "Pathfinders", href: "/pathfinders", icon: Compass },
      { label: "Welfare", href: "/welfare", icon: HeartHandshake },
      { label: "Sabbath School", href: "/sabbath-school", icon: GraduationCap },
      { label: "Health Ministry", href: "/health", icon: HeartPulse },
      { label: "Communion", href: "/communion", icon: Wine },
      { label: "AV Sync", href: "/av", icon: MonitorPlay },
      { label: "District Hub", href: "/district", icon: Building2 },
      { label: "Facilities", href: "/facilities", icon: Building },
      { label: "Crisis Assets", href: "/crisis", icon: AlertTriangle },
      { label: "Transfers", href: "/transfers", icon: ArrowRightLeft },
      { label: "Households", href: "/households", icon: Home },
      { label: "Candidacies", href: "/candidacies", icon: ClipboardCheck },
      { label: "Nominating", href: "/nominating", icon: Vote },
    ],
  },
  {
    label: "Treasurer",
    icon: Landmark,
    roles: ["treasurer"],
    items: [
      { label: "Treasury", href: "/treasury", icon: Landmark },
      { label: "Conference Report", href: "/conference", icon: Presentation },
    ],
  },
];

export function visibleSections(roles: string[]): NavSection[] {
  return navigation
    .map((section) => {
      if (!section.roles) return section;
      return {
        ...section,
        items: section.items.filter(
          (item) => !item.roles || item.roles.some((r) => roles.includes(r)),
        ),
      };
    })
    .filter((section) => {
      if (!section.roles) return section.items.length > 0;
      return section.roles.some((r) => roles.includes(r));
    });
}
