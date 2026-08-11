"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, ScrollText } from "lucide-react";
import { AppShell } from "@/components/telephony/app-shell";
import {
  EmptyState,
  PageHeader,
  StatBlock,
} from "@/components/telephony/primitives";
import { useTelephony } from "@/contexts/telephony-context";
import { accountStatus } from "@/lib/telephony/status";

export function SipDashboardClient() {
  return (
    <AppShell>
      <SipDashboardPage />
    </AppShell>
  );
}

function SipDashboardPage() {
  const { user, visibleAccounts, auditEvents } = useTelephony();
  const isAdmin = user?.role === "admin";

  const stats = useMemo(() => {
    const s = visibleAccounts.map(accountStatus);
    return {
      total: visibleAccounts.length,
      active: s.filter((x) => x === "active").length,
      expiring: s.filter((x) => x === "expiring").length,
      inactive: s.filter((x) => x === "disabled" || x === "expired").length,
    };
  }, [visibleAccounts]);

  const recent = auditEvents.filter((e) => e.module === "sip").slice(0, 5);

  return (
    <div className="space-y-10">
      <PageHeader
        module="sip"
        eyebrow={isAdmin ? "Platform-wide" : "Your workspace"}
        title="SIP dashboard"
        description={
          isAdmin
            ? "Registration health across every SIP identity on the cluster."
            : "Registration health for the accounts your organisation created."
        }
        actions={
          <Link
            href="/sip/accounts"
            className="module-bg inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-transform active:scale-[0.98]"
          >
            Manage accounts
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        }
      />

      <section
        aria-label="Overview"
        className="grid grid-cols-2 gap-6 lg:grid-cols-4"
      >
        <StatBlock label="Total accounts" value={stats.total} />
        <StatBlock
          label="Active"
          value={stats.active}
          tone="success"
          hint="Registering normally"
        />
        <StatBlock
          label="Expiring ≤ 30 days"
          value={stats.expiring}
          tone="accent"
          hint="Needs renewal"
        />
        <StatBlock
          label="Disabled / expired"
          value={stats.inactive}
          tone="negative"
          hint="Not registering"
        />
      </section>

      {isAdmin ? (
        <section aria-labelledby="recent-activity" className="space-y-4">
          <h2 id="recent-activity" className="label-meta">
            Recent activity
          </h2>
          {recent.length === 0 ? (
            <div className="glass rounded-[20px]">
              <EmptyState
                icon={<ScrollText aria-hidden="true" className="size-5" />}
                title="No activity recorded yet"
                description="Account changes made this session will appear here."
                action={
                  <Link
                    href="/sip/audit-logs"
                    className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium"
                  >
                    View full audit log
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="space-y-2">
              {recent.map((e) => (
                <li
                  key={e.id}
                  className="glass flex items-center justify-between gap-4 rounded-[16px] px-5 py-3.5"
                >
                  <p className="min-w-0 truncate text-sm">
                    <span className="font-medium">{e.target}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      — {e.action
                        .replace("account.", "")
                        .replace(".", " ")} by {e.actorName}
                    </span>
                  </p>
                  <span className="label-meta shrink-0">
                    {new Date(e.at).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
