"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/telephony/app-shell";
import { EmptyState, PageHeader } from "@/components/telephony/primitives";
import { StatusPill } from "@/components/telephony/status-pill";
import { RenewResellerDialog } from "@/components/telephony/reseller-dialogs";
import { useTelephony } from "@/contexts/telephony-context";
import { daysUntil, formatDate, resellerStatus } from "@/lib/telephony/status";
import type { Reseller } from "@/lib/telephony/types";

export function ResellerSubscriptionsClient() {
  return (
    <AppShell>
      <ResellerSubscriptionsPage />
    </AppShell>
  );
}

function ResellerSubscriptionsPage() {
  const { user, resellers, resellersLoading } = useTelephony();
  const [renewing, setRenewing] = useState<Reseller | null>(null);

  const rows = useMemo(
    () =>
      [...resellers].sort(
        (a, b) => +new Date(a.expiresAt ?? 0) - +new Date(b.expiresAt ?? 0),
      ),
    [resellers],
  );

  if (user?.role !== "admin") {
    return (
      <EmptyState
        title="Administrators only"
        description="Reseller subscriptions are restricted to platform administrators."
      />
    );
  }

  const needsRenewal = rows.filter((r) => {
    const s = resellerStatus(r);
    return s === "expiring" || s === "expired";
  }).length;

  return (
    <div className="space-y-10">
      <PageHeader
        module="sip"
        eyebrow="Reseller management"
        title="Reseller subscriptions"
        description={`${needsRenewal} reseller${needsRenewal === 1 ? "" : "s"} need renewal, sorted soonest-expiry first.`}
      />

      {resellersLoading ? (
        <div className="glass rounded-[20px]">
          <EmptyState
            title="Loading subscriptions…"
            description="Fetching the current reseller list from the cluster."
          />
        </div>
      ) : rows.length === 0 ? (
        <div className="glass rounded-[20px]">
          <EmptyState
            title="No resellers yet"
            description="Subscriptions appear here once resellers are provisioned."
          />
        </div>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => {
            const days = r.expiresAt ? daysUntil(r.expiresAt) : null;
            return (
              <li
                key={r.id}
                className="glass flex flex-wrap items-center justify-between gap-4 rounded-[16px] px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium">{r.username}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm tabular-nums">
                      {r.expiresAt ? formatDate(r.expiresAt) : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {days === null
                        ? "No expiry set"
                        : days < 0
                          ? `${Math.abs(days)}d overdue`
                          : `${days}d remaining`}
                    </p>
                  </div>
                  <StatusPill status={resellerStatus(r)} />
                  <button
                    type="button"
                    onClick={() => setRenewing(r)}
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

      <RenewResellerDialog
        reseller={renewing}
        onClose={() => setRenewing(null)}
      />
    </div>
  );
}
