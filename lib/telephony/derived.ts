import { accountStatus } from "./status";
import type { ModuleKey, MockUser, Reseller, SipAccount } from "./types";

export interface ResellerRow {
  user: MockUser;
  accountCount: number;
}

/** Resellers who hold access to the given module, with their account count. */
export function getResellers(
  users: MockUser[],
  accounts: SipAccount[],
  module: ModuleKey,
): ResellerRow[] {
  return users
    .filter((u) => u.role === "reseller" && u.modules.includes(module))
    .map((user) => ({
      user,
      accountCount:
        module === "sip"
          ? accounts.filter((a) => a.createdById === user.id).length
          : 0,
    }));
}

/**
 * "End users" scoped to a module = the identities held by that module's
 * accounts. Today only SIP has a real account entity, so this is a thin
 * wrapper — it's the seam where an EsimProfile holder list would plug in.
 */
export function getEndUsers(
  accounts: SipAccount[],
  module: ModuleKey,
): SipAccount[] {
  return module === "sip" ? accounts : [];
}

export interface AccountStatusBreakdown {
  active: number;
  expiring: number;
  disabled: number;
}

/** Three-way status split for the given accounts — expired folds into disabled,
 * matching the "Disabled / expired" grouping already used on the stat cards. */
export function getAccountStatusBreakdown(
  accounts: SipAccount[],
): AccountStatusBreakdown {
  const statuses = accounts.map(accountStatus);
  return {
    active: statuses.filter((s) => s === "active").length,
    expiring: statuses.filter((s) => s === "expiring").length,
    disabled: statuses.filter((s) => s === "disabled" || s === "expired")
      .length,
  };
}

export interface DayCount {
  /** Local calendar date, YYYY-MM-DD */
  date: string;
  count: number;
}

/** Local calendar-date key (not UTC) — `toISOString().slice(0, 10)` shifts
 * by a day in any positive UTC-offset timezone, since it renders the date
 * in UTC rather than the viewer's local day. */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Accounts created per day over the trailing window, oldest first, with
 * zero-filled gaps so the series always has exactly `days` points. Buckets
 * and account timestamps are both keyed by local calendar date, so "today"
 * lines up with the viewer's actual today regardless of timezone. */
export function getAccountsCreatedByDay(
  accounts: SipAccount[],
  days = 30,
): DayCount[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const key = localDateKey(new Date(startOfToday.getTime() - i * 86_400_000));
    buckets.set(key, 0);
  }

  for (const a of accounts) {
    const key = localDateKey(new Date(a.createdAt));
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

export interface ResellerAccountStats {
  reseller: Reseller;
  total: number;
  active: number;
  disabled: number;
}

/**
 * Per-reseller account totals with an active/disabled split — same
 * createdById-matching technique as `getResellers()` above, but against the
 * real reseller logins (`Reseller[]`, backed by /api/admins) rather than
 * `MOCK_USERS`, since that's what SIP resellers actually are once the
 * account-count needs an active/disabled breakdown alongside it.
 */
export function getResellerAccountStats(
  resellers: Reseller[],
  accounts: SipAccount[],
): ResellerAccountStats[] {
  return resellers.map((reseller) => {
    const owned = accounts.filter((a) => a.createdById === reseller.id);
    const active = owned.filter((a) => accountStatus(a) === "active").length;
    return {
      reseller,
      total: owned.length,
      active,
      disabled: owned.length - active,
    };
  });
}
