"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { AppShell } from "@/components/telephony/app-shell";
import { EmptyState, PageHeader } from "@/components/telephony/primitives";
import { PillSelect } from "@/components/telephony/pill-select";
import { SubscriptionRow } from "@/components/telephony/subscription-row";
import { RenewDialog } from "@/components/telephony/account-dialogs";
import { useTelephony } from "@/contexts/telephony-context";
import { accountStatus } from "@/lib/telephony/status";
import type { AccountStatus, SipAccount } from "@/lib/telephony/types";
import { cn } from "@/lib/utils";

const FILTERS: { key: AccountStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "expiring", label: "Expiring" },
  { key: "disabled", label: "Disabled" },
  { key: "expired", label: "Expired" },
];

export function SipSubscriptionsClient() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <SipSubscriptionsPage />
      </Suspense>
    </AppShell>
  );
}

function SipSubscriptionsPage() {
  const { user, visibleAccounts, resellers } = useTelephony();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resellerFilter = searchParams.get("reseller");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AccountStatus | "all">("all");
  const [sort, setSort] = useState<"expiry" | "created" | "identifier">(
    "expiry",
  );
  const [renewing, setRenewing] = useState<SipAccount | null>(null);
  const isAdmin = user?.role === "admin";

  const resellerFilterName = resellerFilter
    ? (resellers.find((r) => r.id === resellerFilter)?.username ??
      resellerFilter)
    : null;

  const accountsInScope = useMemo(
    () =>
      resellerFilter
        ? visibleAccounts.filter((a) => a.createdById === resellerFilter)
        : visibleAccounts,
    [visibleAccounts, resellerFilter],
  );

  const needsRenewal = accountsInScope.filter((a) => {
    const s = accountStatus(a);
    return s === "expiring" || s === "expired";
  }).length;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = accountsInScope.filter((a) => {
      const matchQ =
        !q ||
        a.sipId.toLowerCase().includes(q) ||
        a.displayName.toLowerCase().includes(q);
      const matchF = filter === "all" || accountStatus(a) === filter;
      return matchQ && matchF;
    });
    return [...list].sort((a, b) => {
      if (sort === "identifier") return a.sipId.localeCompare(b.sipId);
      if (sort === "created")
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      return +new Date(a.expiresAt) - +new Date(b.expiresAt);
    });
  }, [accountsInScope, query, filter, sort]);

  return (
    <div className="space-y-10">
      <PageHeader
        module="sip"
        eyebrow={isAdmin ? "Platform-wide" : "Your accounts"}
        title="Subscriptions"
        description={`${needsRenewal} account${needsRenewal === 1 ? "" : "s"} need renewal, sorted soonest-expiry first.`}
      />

      {resellerFilterName ? (
        <div className="glass flex items-center justify-between gap-3 rounded-xl px-4 py-2.5">
          <p className="text-sm">
            Showing accounts owned by{" "}
            <span className="font-semibold">{resellerFilterName}</span>
          </p>
          <button
            type="button"
            onClick={() => router.push("/sip/subscriptions")}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-secondary px-3 text-xs font-semibold"
          >
            <X aria-hidden="true" className="size-3.5" />
            Clear
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:w-80">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground max-md:z-10"
          />
          <input
            type="search"
            aria-label="Search subscriptions"
            placeholder="Search by SIP identifier or name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="glass h-11 w-full rounded-xl border-0 pl-11 pr-4 text-sm outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Filter by status"
            className="chip-scroll-row flex flex-wrap gap-1.5"
          >
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "h-9 shrink-0 rounded-full px-3.5 font-mono text-[11px] tracking-wider uppercase transition-colors",
                  filter === f.key
                    ? "module-bg"
                    : "glass text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <PillSelect
            id="sort"
            label="Sort subscriptions"
            value={sort}
            onChange={setSort}
            options={[
              { value: "expiry", label: "Sort: expiry" },
              { value: "created", label: "Sort: newest" },
              { value: "identifier", label: "Sort: identifier" },
            ]}
          />
          {isAdmin ? (
            <PillSelect
              id="owner-filter"
              label="Filter by owner"
              value={resellerFilter ?? "all"}
              onChange={(value) => {
                router.push(
                  value === "all"
                    ? "/sip/subscriptions"
                    : `/sip/subscriptions?reseller=${value}`,
                );
              }}
              options={[
                { value: "all", label: "Owned by: all" },
                ...resellers.map((r) => ({
                  value: r.id,
                  label: `Owned by: ${r.username}`,
                })),
              ]}
              className="max-md:max-w-56"
            />
          ) : null}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="glass rounded-[20px]">
          <EmptyState
            title={
              query || filter !== "all"
                ? "No subscriptions match those filters"
                : "No accounts yet"
            }
            description={
              query || filter !== "all"
                ? "Try a different search term or clear the status filter to see the full list."
                : "Subscriptions appear here once SIP accounts are provisioned."
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
          {rows.map((a) => (
            <SubscriptionRow
              key={a.id}
              title={a.sipId}
              subtitle={a.email}
              expiresAt={a.expiresAt}
              status={accountStatus(a)}
              onRenew={() => setRenewing(a)}
            />
          ))}
        </ul>
      )}

      <RenewDialog account={renewing} onClose={() => setRenewing(null)} />
    </div>
  );
}
