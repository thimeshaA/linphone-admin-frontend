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
            return (
              <li
                key={a.id}
                className="glass flex flex-wrap items-center justify-between gap-4 rounded-[16px] px-5 py-4"
              >
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
                      {days < 0
                        ? `${Math.abs(days)}d overdue`
                        : `${days}d remaining`}
                    </p>
                  </div>
                  <StatusPill status={accountStatus(a)} />
                  <button
                    type="button"
                    onClick={() => setRenewing(a)}
                    className="module-bg h-10 shrink-0 rounded-xl px-4 text-sm font-semibold"
                  >
                    Renew
                  </button>
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
