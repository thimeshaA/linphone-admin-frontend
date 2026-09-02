"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/telephony/app-shell";
import { EmptyState, PageHeader } from "@/components/telephony/primitives";
import { StatusPill } from "@/components/telephony/status-pill";
import { RenewDialog } from "@/components/telephony/account-dialogs";
import { useTelephony } from "@/contexts/telephony-context";
import { accountStatus, daysUntil, formatDate } from "@/lib/telephony/status";
import type { SipAccount } from "@/lib/telephony/types";

export function SipSubscriptionsClient() {
  return (
    <AppShell>
      <SipSubscriptionsPage />
    </AppShell>
  );
}

function SipSubscriptionsPage() {
  const { user, visibleAccounts } = useTelephony();
  const [renewing, setRenewing] = useState<SipAccount | null>(null);
  const isAdmin = user?.role === "admin";

  const rows = useMemo(
    () =>
      [...visibleAccounts].sort(
        (a, b) => +new Date(a.expiresAt) - +new Date(b.expiresAt),
      ),
    [visibleAccounts],
  );

  const needsRenewal = rows.filter((a) => {
    const s = accountStatus(a);
    return s === "expiring" || s === "expired";
  }).length;

  return (
    <div className="space-y-10">
      <PageHeader
        module="sip"
        eyebrow={isAdmin ? "Platform-wide" : "Your accounts"}
        title="Subscriptions"
        description={`${needsRenewal} account${needsRenewal === 1 ? "" : "s"} need renewal, sorted soonest-expiry first.`}
      />

      {rows.length === 0 ? (
        <div className="glass rounded-[20px]">
          <EmptyState
            title="No accounts yet"
            description="Subscriptions appear here once SIP accounts are provisioned."
          />
        </div>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((a) => {
            const days = daysUntil(a.expiresAt);
            const daysLabel =
              days < 0
                ? `${Math.abs(days)}d overdue`
                : `${days}d remaining`;
            const status = accountStatus(a);
            return (
              <li
                key={a.id}
                className="glass rounded-[16px] px-4 py-3.5 md:px-5 md:py-4"
              >
                {/* Desktop: single row */}
                <div className="hidden md:flex md:flex-wrap md:items-center md:justify-between md:gap-4">
                  <div className="min-w-0">
                    <p className="font-medium">{a.displayName}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {a.sipId}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm tabular-nums">
                        {formatDate(a.expiresAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {daysLabel}
                      </p>
                    </div>
                    <StatusPill status={status} />
                    <button
                      type="button"
                      onClick={() => setRenewing(a)}
                      className="module-bg h-10 shrink-0 rounded-xl px-4 text-sm font-semibold"
                    >
                      Renew
                    </button>
                  </div>
                </div>

                {/* Mobile: stacked */}
                <div className="md:hidden">
                  <p className="truncate font-medium">{a.displayName}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {a.sipId}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <div>
                        <p className="text-sm tabular-nums">
                          {formatDate(a.expiresAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {daysLabel}
                        </p>
                      </div>
                      <StatusPill status={status} className="shrink-0" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setRenewing(a)}
                      className="module-bg h-10 shrink-0 rounded-xl px-4 text-sm font-semibold"
                    >
                      Renew
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <RenewDialog account={renewing} onClose={() => setRenewing(null)} />
    </div>
  );
}
