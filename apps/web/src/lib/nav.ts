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
import Scale from "@lucide/svelte/icons/scale";
import Presentation from "@lucide/svelte/icons/presentation";
import HelpCircle from "@lucide/svelte/icons/help-circle";
import ShieldCheck from "@lucide/svelte/icons/shield-check";
import History from "@lucide/svelte/icons/history";
import Rocket from "@lucide/svelte/icons/rocket";

import type { Component } from "svelte";

type IconComponent = Component<any>;

export interface NavItem {
  labelKey: string;
  href: string;
  icon: IconComponent;
  roles?: string[];
}

export interface NavSection {
  labelKey: string;
  icon: IconComponent;
  roles?: string[];
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
    items: [
      { labelKey: "nav.overview", href: "/dashboard", icon: LayoutDashboard },
      { labelKey: "nav.help_center", href: "/help", icon: HelpCircle },
    ],
  },
  {
    labelKey: "nav.member",
    icon: User,
    items: [
      { labelKey: "nav.profile", href: "/me", icon: User },
      { labelKey: "nav.giving", href: "/receipts", icon: Receipt },
    ],
  },
  {
    labelKey: "nav.clerk",
    icon: ClipboardCheck,
    roles: ["clerk"],
    items: [
      { labelKey: "nav.boardroom", href: "/boardroom", icon: Gavel },
      { labelKey: "nav.duty_rota", href: "/rota", icon: CalendarCheck },
      { labelKey: "nav.congregation", href: "/congregation", icon: Church },
      { labelKey: "nav.congregation_setup", href: "/setup", icon: Rocket },
      { labelKey: "nav.pathfinders", href: "/pathfinders", icon: Compass },
      { labelKey: "nav.welfare", href: "/welfare", icon: HeartHandshake },
      {
        labelKey: "nav.sabbath_school",
        href: "/sabbath-school",
        icon: GraduationCap,
      },
      { labelKey: "nav.health_ministry", href: "/health", icon: HeartPulse },
      { labelKey: "nav.communion", href: "/communion", icon: Wine },
      { labelKey: "nav.av_sync", href: "/av", icon: MonitorPlay },
      { labelKey: "nav.district_hub", href: "/district", icon: Building2 },
      { labelKey: "nav.facilities", href: "/facilities", icon: Building },
      { labelKey: "nav.crisis_assets", href: "/crisis", icon: AlertTriangle },
      { labelKey: "nav.transfers", href: "/transfers", icon: ArrowRightLeft },
      { labelKey: "nav.households", href: "/households", icon: Home },
      {
        labelKey: "nav.candidacies",
        href: "/candidacies",
        icon: ClipboardCheck,
      },
      { labelKey: "nav.nominating", href: "/nominating", icon: Vote },
      { labelKey: "nav.discipline", href: "/discipline", icon: Scale },
      { labelKey: "nav.safety", href: "/safety", icon: ShieldCheck },
      { labelKey: "nav.audit", href: "/audit", icon: History },
    ],
  },
  {
    labelKey: "nav.treasurer",
    icon: Landmark,
    roles: ["treasurer"],
    items: [
      { labelKey: "nav.treasury", href: "/treasury", icon: Landmark },
      {
        labelKey: "nav.conference_report",
        href: "/conference",
        icon: Presentation,
      },
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
          (item) => !item.roles || item.roles.some((r) => roles.includes(r))
        ),
      };
    })
    .filter((section) => {
      if (!section.roles) return section.items.length > 0;
      return section.roles.some((r) => roles.includes(r));
    });
}
