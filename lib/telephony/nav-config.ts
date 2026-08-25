import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ChartNoAxesCombined,
  CreditCard,
  Globe2,
  LayoutDashboard,
  PhoneCall,
  ScrollText,
  Settings as SettingsIcon,
  ShieldCheck,
  Signal,
  UserRound,
  Users,
} from "lucide-react";

export type Accent = "success" | "sip" | "esim";
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
    ],
  },
  {
    id: "esim",
    label: "eSIM",
    icon: Signal,
    accent: "esim",
    group: "workspaces",
    defaultRoute: "/esim/dashboard",
    routeMatch: "/esim",
    permission: "esim.module",
    children: [
      {
        kind: "link",
        id: "dashboard",
        label: "Dashboard",
        route: "/esim/dashboard",
        icon: LayoutDashboard,
      },
      {
        kind: "link",
        id: "countries",
        label: "Countries",
        route: "/esim/countries",
        icon: Globe2,
      },
      {
        kind: "link",
        id: "subscriptions",
        label: "Subscriptions",
        route: "/esim/subscriptions",
        icon: CreditCard,
      },
      { kind: "section", label: "Customer Management" },
      {
        kind: "link",
        id: "resellers",
        label: "Resellers",
        route: "/esim/resellers",
        icon: Users,
        adminOnly: true,
      },
      {
        kind: "link",
        id: "end-users",
        label: "End Users",
        route: "/esim/end-users",
        icon: UserRound,
      },
      {
        kind: "link",
        id: "users-roles",
        label: "Users & Roles",
        route: "/esim/users-roles",
        icon: ShieldCheck,
        adminOnly: true,
      },
      {
        kind: "link",
        id: "audit-logs",
        label: "Audit Logs",
        route: "/esim/audit-logs",
        icon: ScrollText,
        adminOnly: true,
      },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: ChartNoAxesCombined,
    accent: "success",
    group: "tools",
    defaultRoute: "/reports",
    routeMatch: "/reports",
    permission: "platform.reports",
    children: [],
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
