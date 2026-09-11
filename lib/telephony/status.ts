import type { AccountStatus, Reseller, SipAccount } from "./types";

const EXPIRING_WINDOW_DAYS = 30;

export function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function accountStatus(account: SipAccount): AccountStatus {
  if (account.disabled) return "disabled";
  const d = daysUntil(account.expiresAt);
  if (d < 0) return "expired";
  if (d <= EXPIRING_WINDOW_DAYS) return "expiring";
  return "active";
}

/**
 * Live client-side status, same precedence as `accountStatus()`: a manual
 * disable always wins, then a past/near expiry — so "expiring soon" shows up
 * without waiting on the backend's lazy expiry check (which only runs on the
 * reseller's next login attempt).
 */
export function resellerStatus(r: Reseller): AccountStatus {
  if (r.status === "disabled") return "disabled";
  if (!r.expiresAt) return r.status === "expired" ? "expired" : "active";
  const d = daysUntil(r.expiresAt);
  if (d < 0) return "expired";
  if (d <= EXPIRING_WINDOW_DAYS) return "expiring";
  return "active";
}

export const STATUS_LABEL: Record<AccountStatus, string> = {
  active: "Active",
  expiring: "Expiring soon",
  disabled: "Disabled",
  expired: "Expired",
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function toDateInput(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

const RELATIVE_UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] =
  [
    { unit: "year", seconds: 31536000 },
    { unit: "month", seconds: 2592000 },
    { unit: "week", seconds: 604800 },
    { unit: "day", seconds: 86400 },
    { unit: "hour", seconds: 3600 },
    { unit: "minute", seconds: 60 },
  ];
const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

export function formatRelativeTime(iso: string) {
  const diffSeconds = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const { unit, seconds } of RELATIVE_UNITS) {
    if (Math.abs(diffSeconds) >= seconds) {
      return relativeTimeFormatter.format(
        Math.round(diffSeconds / seconds),
        unit,
      );
    }
  }
  return relativeTimeFormatter.format(Math.round(diffSeconds), "second");
}
