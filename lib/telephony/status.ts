import type { AccountStatus, SipAccount } from "./types";

export const EXPIRING_WINDOW_DAYS = 30;

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
