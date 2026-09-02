"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/telephony/app-shell";
import { EmptyState, PageHeader } from "@/components/telephony/primitives";
import { StatusPill } from "@/components/telephony/status-pill";
import { RenewResellerDialog } from "@/components/telephony/reseller-dialogs";
import { useTelephony } from "@/contexts/telephony-context";
import { daysUntil, formatDate, resellerStatus } from "@/lib/telephony/status";
import type { Reseller } from "@/lib/telephony/types";
import { cn } from "@/lib/utils";

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
            const daysLabel =
              days === null
                ? "No expiry set"
                : days < 0
                  ? `${Math.abs(days)}d overdue`
                  : `${days}d remaining`;
            const status = resellerStatus(r);
            const urgent = status !== "active";
            return (
              <li
                key={r.id}
                className="glass rounded-[16px] px-4 py-3.5 md:px-5 md:py-4"
              >
                {/* Desktop: unchanged single-row layout */}
                <div className="hidden md:flex md:flex-wrap md:items-center md:justify-between md:gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium">
                      {r.username}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm tabular-nums">
                        {r.expiresAt ? formatDate(r.expiresAt) : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {daysLabel}
                      </p>
                    </div>
                    <StatusPill status={status} />
                    <button
                      type="button"
                      onClick={() => setRenewing(r)}
                      className="module-bg h-10 shrink-0 rounded-xl px-4 text-sm font-semibold"
                    >
                      Renew
                    </button>
                  </div>
                </div>

                {/* Mobile: stacked, urgency-scaled Renew button */}
                <div className="md:hidden">
                  <p className="truncate font-mono text-sm font-medium">
                    {r.username}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <div>
                        <p className="text-sm tabular-nums">
                          {r.expiresAt ? formatDate(r.expiresAt) : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {daysLabel}
                        </p>
                      </div>
                      <StatusPill status={status} className="shrink-0" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setRenewing(r)}
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
