"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, Users } from "lucide-react";
import { AppShell } from "@/components/telephony/app-shell";
import {
  EmptyState,
  PageHeader,
  StatBlock,
} from "@/components/telephony/primitives";
import { StatusPill } from "@/components/telephony/status-pill";
import {
  AccountsTrendChart,
  ActiveDisabledSplit,
  StatusDonutChart,
  TopResellersChart,
} from "@/components/telephony/dashboard-charts";
import { useTelephony } from "@/contexts/telephony-context";
import { accountStatus, resellerStatus } from "@/lib/telephony/status";
import {
  getAccountStatusBreakdown,
  getAccountsCreatedByDay,
  getResellerAccountStats,
  type ResellerAccountStats,
} from "@/lib/telephony/derived";
import { cn } from "@/lib/utils";

export function SipDashboardClient() {
  return (
    <AppShell>
      <SipDashboardPage />
    </AppShell>
  );
}

function SipDashboardPage() {
  const { user, visibleAccounts, accounts, resellers, resellersLoading } =
    useTelephony();
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

  const statusBreakdown = useMemo(
    () => getAccountStatusBreakdown(visibleAccounts),
    [visibleAccounts],
  );
  const trend = useMemo(
    () => getAccountsCreatedByDay(visibleAccounts, 30),
    [visibleAccounts],
  );
  const resellerStats = useMemo(
    () => (isAdmin ? getResellerAccountStats(resellers, accounts) : []),
    [isAdmin, resellers, accounts],
  );

  return (
    <div className="space-y-10">
      <PageHeader
        module="sip"
        eyebrow={isAdmin ? "Platform-wide" : "Your workspace"}
        title="SIP dashboard"
        description={
          isAdmin
            ? "Registration health and account analytics across every SIP identity on the cluster."
            : "Registration health and account analytics for the accounts your organisation created."
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

      <section
        aria-label="Analytics"
        className={cn(
          "grid gap-6",
          isAdmin ? "lg:grid-cols-3" : "lg:grid-cols-2",
        )}
      >
        <ChartCard
          title="Status distribution"
          description="Active, expiring and disabled accounts."
        >
          <StatusDonutChart breakdown={statusBreakdown} />
        </ChartCard>

        {isAdmin ? (
          <ChartCard
            title="Top resellers"
            description="Ranked by total accounts created."
          >
            {resellersLoading ? (
              <EmptyState
                title="Loading resellers…"
                description="Fetching reseller totals from the cluster."
              />
            ) : (
              <TopResellersChart stats={resellerStats} />
            )}
          </ChartCard>
        ) : null}

        <ChartCard title="Accounts created" description="Last 30 days, by day.">
          <AccountsTrendChart series={trend} />
        </ChartCard>
      </section>

      {isAdmin ? (
        <ResellerBreakdownTable
          stats={resellerStats}
          loading={resellersLoading}
        />
      ) : null}
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="glass space-y-4 rounded-[20px] p-5">
      <div>
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

type ResellerSort = "accounts" | "created" | "username";
const PAGE_SIZE = 8;

function ResellerBreakdownTable({
  stats,
  loading,
}: {
  stats: ResellerAccountStats[];
  loading: boolean;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ResellerSort>("accounts");
  const [page, setPage] = useState(0);

  const rows = stats.filter((s) => {
    const q = query.trim().toLowerCase();
    return !q || s.reseller.username.toLowerCase().includes(q);
  });

  const sortedRows = [...rows].sort((a, b) => {
    if (sort === "username")
      return a.reseller.username.localeCompare(b.reseller.username);
    if (sort === "created")
      return +new Date(b.reseller.createdAt) - +new Date(a.reseller.createdAt);
    return b.total - a.total;
  });

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pageRows = sortedRows.slice(
    current * PAGE_SIZE,
    current * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <section aria-label="Reseller breakdown" className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="label-meta">By reseller</h2>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:w-80">
          <Search
            aria-hidden="true"
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            aria-label="Search resellers"
            placeholder="Search by username"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            className="glass h-11 w-full rounded-xl border-0 pl-11 pr-4 text-sm outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="reseller-breakdown-sort">
            Sort resellers
          </label>
          <select
            id="reseller-breakdown-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as ResellerSort)}
            className="glass h-9 rounded-full px-3 font-mono text-[11px] tracking-wider uppercase outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="accounts">Sort: accounts (high–low)</option>
            <option value="created">Sort: newest</option>
            <option value="username">Sort: username</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="glass rounded-[20px]">
          <EmptyState
            title="Loading resellers…"
            description="Fetching the current reseller list from the cluster."
          />
        </div>
      ) : sortedRows.length === 0 ? (
        <div className="glass rounded-[20px]">
          <EmptyState
            icon={<Users aria-hidden="true" className="size-5" />}
            title={
              query ? "No resellers match that search" : "No resellers yet"
            }
            description={
              query
                ? "Try a different search term to see the full list."
                : "Reseller breakdown appears once resellers are provisioned."
            }
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="glass hidden overflow-x-auto rounded-[20px] md:block">
            <table className="w-full min-w-[760px] text-sm">
              <caption className="sr-only">
                Resellers with total accounts, active/disabled split and status
              </caption>
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Reseller",
                    "Total accounts",
                    "Active / disabled",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="label-meta px-5 py-3.5 text-left"
                    >
                      {h}
                    </th>
                  ))}
                  <th scope="col" className="label-meta px-5 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map(({ reseller, total, active, disabled }) => (
                  <tr
                    key={reseller.id}
                    className="border-b border-border last:border-0 hover:bg-accent/30"
                  >
                    <th
                      scope="row"
                      className="px-5 py-4 text-left font-mono text-xs font-normal"
                    >
                      {reseller.username}
                    </th>
                    <td className="px-5 py-4 tabular-nums">{total}</td>
                    <td className="px-5 py-4">
                      <ActiveDisabledSplit
                        active={active}
                        disabled={disabled}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={resellerStatus(reseller)} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/sip/accounts?reseller=${reseller.id}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-secondary px-3 text-xs font-semibold"
                        >
                          View accounts
                          <ArrowUpRight
                            aria-hidden="true"
                            className="size-3.5"
                          />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {pageRows.map(({ reseller, total, active, disabled }) => (
              <li key={reseller.id} className="glass rounded-[20px] p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate font-mono text-sm font-medium">
                    {reseller.username}
                  </p>
                  <StatusPill
                    status={resellerStatus(reseller)}
                    className="shrink-0"
                  />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <dt className="label-meta">Total accounts</dt>
                    <dd className="mt-1 text-sm tabular-nums">{total}</dd>
                  </div>
                  <div>
                    <dt className="label-meta">Active / disabled</dt>
                    <dd className="mt-1">
                      <ActiveDisabledSplit
                        active={active}
                        disabled={disabled}
                      />
                    </dd>
                  </div>
                </dl>
                <Link
                  href={`/sip/accounts?reseller=${reseller.id}`}
                  className="mt-4 flex h-11 items-center justify-center gap-1.5 rounded-xl bg-secondary text-sm font-semibold"
                >
                  View accounts
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between gap-3">
            <p className="label-meta">
              {current * PAGE_SIZE + 1}–{current * PAGE_SIZE + pageRows.length}{" "}
              of {sortedRows.length}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={current === 0}
                onClick={() => setPage(current - 1)}
                className="glass h-10 rounded-xl px-4 text-sm font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={current >= pageCount - 1}
                onClick={() => setPage(current + 1)}
                className="glass h-10 rounded-xl px-4 text-sm font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
