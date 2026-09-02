import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ChartNoAxesCombined,
  CreditCard,
  LayoutDashboard,
  PhoneCall,
  ScrollText,
  Settings as SettingsIcon,
  Users,
} from "lucide-react";

export type Accent = "success" | "sip";
export type Group = "platform" | "workspaces" | "tools";

export type SecondaryLeaf = {
  kind: "link";
  id: string;
  label: string;
  route: string;
  icon?: LucideIcon;
  /** Platform-management concept nested in the workspace — admin only. */
  adminOnly?: boolean;
};
export type SecondarySection = { kind: "section"; label: string };
export type SecondaryItem = SecondaryLeaf | SecondarySection;

export type PrimaryArea = {
  id: string;
  label: string;
  /** Shorter label for the narrow rail — falls back to `label`. */
  shortLabel?: string;
  icon: LucideIcon;
  accent: Accent;
  group: Group;
  /** First child's route — clicking the rail icon navigates here. */
  defaultRoute: string;
  /** Pathname prefix used to detect this area as active. */
  routeMatch: string;
  /** Permission key checked against the current user's permission set. */
  permission: string;
  children: SecondaryItem[];
};

export const PRIMARY_AREAS: PrimaryArea[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    accent: "success",
    group: "platform",
    defaultRoute: "/overview",
    routeMatch: "/overview",
    permission: "platform.overview",
    // A single destination — nothing to show in a flyout.
    children: [],
  },
  {
    id: "sip",
    label: "SIP Accounts",
    shortLabel: "SIP",
    icon: PhoneCall,
    accent: "sip",
    group: "workspaces",
    defaultRoute: "/sip/dashboard",
    routeMatch: "/sip",
    permission: "sip.module",
    children: [
      {
        kind: "link",
        id: "dashboard",
        label: "Dashboard",
        route: "/sip/dashboard",
        icon: LayoutDashboard,
      },
      { kind: "section", label: "Reseller Management" },
      {
        kind: "link",
        id: "resellers",
        label: "Resellers",
        route: "/sip/resellers",
        icon: Users,
        adminOnly: true,
      },
      {
        kind: "link",
        id: "reseller-subscriptions",
        label: "Subscriptions",
        route: "/sip/reseller-subscriptions",
        icon: CreditCard,
        adminOnly: true,
      },
      {
        kind: "link",
        id: "reseller-audit-logs",
        label: "Audit Logs",
        route: "/sip/reseller-audit-logs",
        icon: ScrollText,
        adminOnly: true,
      },
      {
        kind: "link",
        id: "reseller-reports",
        label: "Reports",
        route: "/sip/reseller-reports",
        icon: ChartNoAxesCombined,
        adminOnly: true,
      },
      { kind: "section", label: "Account Management" },
      {
        kind: "link",
        id: "accounts",
        label: "Accounts",
        route: "/sip/accounts",
        icon: PhoneCall,
      },
      {
        kind: "link",
        id: "account-subscriptions",
        label: "Subscriptions",
        route: "/sip/subscriptions",
        icon: CreditCard,
      },
      {
        kind: "link",
        id: "account-audit-logs",
        label: "Audit Logs",
        route: "/sip/audit-logs",
        icon: ScrollText,
        adminOnly: true,
      },
      {
        kind: "link",
        id: "account-reports",
        label: "Reports",
        route: "/sip/reports",
        icon: ChartNoAxesCombined,
      },
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    shortLabel: "Alerts",
    icon: Bell,
    accent: "success",
    group: "tools",
    defaultRoute: "/notifications",
    routeMatch: "/notifications",
    permission: "platform.notifications",
    children: [],
  },
  {
    id: "settings",
    label: "Settings",
    icon: SettingsIcon,
    accent: "success",
    group: "tools",
    defaultRoute: "/settings",
    routeMatch: "/settings",
    permission: "platform.settings",
    children: [],
  },
];
