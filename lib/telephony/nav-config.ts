import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ChartNoAxesCombined,
  CreditCard,
  LayoutDashboard,
  PhoneCall,
  Receipt,
  Settings as SettingsIcon,
  Users,
  Wallet,
} from "lucide-react";

export type Accent = "success" | "sip";
type Group = "platform" | "workspaces" | "tools";

type SecondaryLeaf = {
  kind: "link";
  id: string;
  label: string;
  route: string;
  icon?: LucideIcon;
  /** Platform-management concept nested in the workspace — admin only. */
  adminOnly?: boolean;
  /** A reseller's own concept (e.g. their wallet) — hidden from admins. */
  resellerOnly?: boolean;
};
type SecondarySection = {
  kind: "section";
  label: string;
  /** The section concept itself is admin-only (e.g. "Reseller Management")
   * — suppressed entirely for other roles, rather than opportunistically
   * appearing based on which of its children happen to be visible to them. */
  adminOnly?: boolean;
};
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
      {
        kind: "link",
        id: "wallet",
        label: "Wallet",
        route: "/sip/wallet",
        icon: Wallet,
        resellerOnly: true,
      },
      { kind: "section", label: "Reseller Management", adminOnly: true },
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
        id: "reseller-wallets",
        label: "Wallets",
        route: "/sip/reseller-wallets",
        icon: Wallet,
        adminOnly: true,
      },
      {
        kind: "link",
        id: "reseller-invoices",
        label: "Invoices",
        route: "/sip/reseller-invoices",
        icon: Receipt,
        // Not admin-only: a reseller sees their own (sent) invoices here
        // too — generation/send actions stay admin-only inside the page
        // itself. Physically stays inside this section (for ordering,
        // admin's view groups it here between Wallets and Reports) — the
        // section header itself is what's admin-only, so a reseller sees
        // this item unheaded instead.
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
