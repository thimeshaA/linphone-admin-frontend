"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/telephony/app-shell";
import { EmptyState, PageHeader } from "@/components/telephony/primitives";
import { StatusPill } from "@/components/telephony/status-pill";
import { RenewResellerDialog } from "@/components/telephony/reseller-dialogs";
import { useTelephony } from "@/contexts/telephony-context";
import { daysUntil, formatDate, resellerStatus } from "@/lib/telephony/status";
import type { AccountStatus, Reseller } from "@/lib/telephony/types";
import { cn } from "@/lib/utils";

const FILTERS: { key: AccountStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "expiring", label: "Expiring" },
  { key: "disabled", label: "Disabled" },
  { key: "expired", label: "Expired" },
];

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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AccountStatus | "all">("all");
  const [sort, setSort] = useState<"expiry" | "created" | "identifier">(
    "expiry",
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = resellers.filter((r) => {
      const matchQ = !q || r.username.toLowerCase().includes(q);
      const matchF = filter === "all" || resellerStatus(r) === filter;
      return matchQ && matchF;
    });
    return [...list].sort((a, b) => {
      if (sort === "identifier") return a.username.localeCompare(b.username);
      if (sort === "created")
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      return +new Date(a.expiresAt ?? 0) - +new Date(b.expiresAt ?? 0);
    });
  }, [resellers, query, filter, sort]);

  if (user?.role !== "admin") {
    return (
      <EmptyState
        title="Administrators only"
        description="Reseller subscriptions are restricted to platform administrators."
      />
    );
  }

  const needsRenewal = resellers.filter((r) => {
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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:w-80">
          <Search
            aria-hidden="true"
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            aria-label="Search resellers"
            placeholder="Search by reseller username"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="glass h-11 w-full rounded-xl border-0 pl-11 pr-4 text-sm outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Filter by status"
            className="flex flex-wrap gap-1.5"
          >
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "h-9 rounded-full px-3.5 font-mono text-[11px] tracking-wider uppercase transition-colors",
                  filter === f.key
                    ? "module-bg"
                    : "glass text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor="sort">
            Sort resellers
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="glass h-9 rounded-full px-3 font-mono text-[11px] tracking-wider uppercase outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="expiry">Sort: expiry</option>
            <option value="created">Sort: newest</option>
            <option value="identifier">Sort: identifier</option>
          </select>
        </div>
      </div>

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
            title={
              query || filter !== "all"
                ? "No resellers match those filters"
                : "No resellers yet"
            }
            description={
              query || filter !== "all"
                ? "Try a different search term or clear the status filter to see the full list."
                : "Subscriptions appear here once resellers are provisioned."
            }
            action={
              query || filter !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                  className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium"
                >
                  Clear filters
                </button>
              ) : undefined
            }
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
