"use client";

import { cn } from "@/lib/utils";
import {
  daysUntil,
  distinctSubtitle,
  formatDate,
} from "@/lib/telephony/status";
import type { AccountStatus } from "@/lib/telephony/types";
import { StatusPill } from "./status-pill";

/**
 * One renewal row, shared by SIP subscriptions and reseller subscriptions so
 * the two lists read identically.
 *
 * md and up the row is a grid with fixed expiry and status columns, so every
 * row's date, pill and Renew button line up down the list regardless of how
 * long the date text or pill label is. Below md it stacks: identifier on
 * top, expiry + pill + Renew underneath, with Renew solid only when the
 * subscription actually needs attention.
 */
export function SubscriptionRow({
  title,
  subtitle = "",
  expiresAt,
  status,
  onRenew,
}: {
  /** The identifier — SIP address or reseller username. */
  title: string;
  /** Email; hidden when empty or a repeat of the title. */
  subtitle?: string;
  expiresAt: string | null;
  status: AccountStatus;
  onRenew: () => void;
}) {
  const days = expiresAt ? daysUntil(expiresAt) : null;
  const daysLabel =
    days === null
      ? "No expiry set"
      : days < 0
        ? `${Math.abs(days)}d overdue`
        : `${days}d remaining`;
  const shownSubtitle = distinctSubtitle(subtitle, title);
  const urgent = status !== "active";

  const identity = (
    <div className="min-w-0">
      <p className="truncate font-mono text-sm font-medium" title={title}>
        {title}
      </p>
      {shownSubtitle ? (
        <p className="truncate text-xs text-muted-foreground">
          {shownSubtitle}
        </p>
      ) : null}
    </div>
  );

  const expiry = (
    <div className="md:text-right">
      <p className="text-sm tabular-nums">
        {expiresAt ? formatDate(expiresAt) : "—"}
      </p>
      <p className="text-xs text-muted-foreground">{daysLabel}</p>
    </div>
  );

  return (
    <li className="glass rounded-[16px] px-4 py-3.5 md:px-5 md:py-4">
      {/* Desktop: aligned columns */}
      <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_8rem_9rem_auto] md:items-center md:gap-4">
        {identity}
        {expiry}
        <div className="flex justify-end">
          <StatusPill status={status} />
        </div>
        <button
          type="button"
          onClick={onRenew}
          className="module-bg h-10 shrink-0 rounded-xl px-4 text-sm font-semibold"
        >
          Renew
        </button>
      </div>

      {/* Mobile: stacked, urgency-scaled Renew button */}
      <div className="md:hidden">
        {identity}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
            {expiry}
            <StatusPill status={status} className="shrink-0" />
          </div>
          <button
            type="button"
            onClick={onRenew}
            className={cn(
              "h-10 shrink-0 rounded-xl px-4 text-sm font-semibold transition-colors",
              urgent
                ? "module-bg"
                : "border border-module module-text bg-module/10",
            )}
          >
            Renew
          </button>
        </div>
      </div>
    </li>
  );
}
