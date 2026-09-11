"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Search, Wallet as WalletIcon } from "lucide-react";
import { EmptyState, PageHeader, StatBlock } from "./primitives";
import { MetaTag, WalletStatusPill } from "./status-pill";
import { TopUpWalletDialog } from "./top-up-dialog";
import { BalanceStat, formatUsd } from "./wallet-balance";
import { useTelephony } from "@/contexts/telephony-context";
import { useWalletSummaries } from "@/hooks/use-wallet-summaries";
import { formatDate } from "@/lib/telephony/status";
import type { Reseller } from "@/lib/telephony/types";
import { cn } from "@/lib/utils";

type Sort = "balance" | "name";

/** Admin-only. Platform-wide wallet snapshot + one row per reseller —
 * lands here from the "Wallets" nav item. Each row links to
 * `ResellerWalletDetailView`, which is where wallet + invoice actions for
 * that reseller actually live; this list stays focused on finding who
 * needs attention (sortable by balance) plus a fast inline top-up. */
export function ResellerWalletsView() {
  const router = useRouter();
  const { user, resellers, resellersLoading } = useTelephony();
  const isAdmin = user?.role === "admin";
  const {
    summaries,
    loading: summariesLoading,
    refresh: refreshSummaries,
  } = useWalletSummaries(resellers, isAdmin);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("balance");
  const [toppingUp, setToppingUp] = useState<Reseller | null>(null);

  if (!isAdmin) {
    return (
      <EmptyState
        title="Administrators only"
        description="Wallet management is restricted to platform administrators."
      />
    );
  }

  const rows = resellers.filter((r) => {
    const q = query.trim().toLowerCase();
    return !q || r.username.toLowerCase().includes(q);
  });

  const sortedRows = [...rows].sort((a, b) => {
    if (sort === "name") return a.username.localeCompare(b.username);
    const balA = summaries[a.id]?.balanceUsd ?? Number.POSITIVE_INFINITY;
    const balB = summaries[b.id]?.balanceUsd ?? Number.POSITIVE_INFINITY;
    return balA - balB;
  });

  const knownSummaries = Object.values(summaries).filter(
    (s): s is NonNullable<typeof s> => !!s,
  );
  const totalBalance = knownSummaries.reduce((n, s) => n + s.balanceUsd, 0);
  const totalOwed = knownSummaries.reduce(
    (n, s) => n + (s.balanceUsd < 0 ? -s.balanceUsd : 0),
    0,
  );
  const inDebtCount = knownSummaries.filter((s) => s.balanceUsd < 0).length;

  function goToDetail(resellerId: string) {
    router.push(`/sip/reseller-wallets/${resellerId}`);
  }

  return (
    <div className="space-y-10">
      <PageHeader
        module="sip"
        eyebrow="Reseller management"
        title="Wallets"
        description="Balances and payment status across every reseller."
      />

      <section
        aria-label="Overview"
        className="grid grid-cols-2 gap-6 lg:grid-cols-3"
      >
        <BalanceStat
          label="Total balance"
          balanceUsd={totalBalance}
          loading={summariesLoading}
        />
        <BalanceStat
          label="Total owed"
          balanceUsd={totalOwed}
          tone="negative"
          loading={summariesLoading}
          hint="Sum of every negative balance"
        />
        <StatBlock
          label="Resellers in debt"
          value={inDebtCount}
          tone={inDebtCount > 0 ? "negative" : "default"}
          loading={summariesLoading}
        />
      </section>

      <section aria-label="Wallets" className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative lg:w-80">
            <Search
              aria-hidden="true"
              className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              aria-label="Search by name"
              placeholder="Search by name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="glass h-11 w-full rounded-xl border-0 pl-11 pr-4 text-sm outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <label className="sr-only" htmlFor="wallet-sort">
            Sort
          </label>
          <select
            id="wallet-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="glass h-9 w-fit rounded-full px-3 font-mono text-[11px] tracking-wider uppercase outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="balance">Sort: most owed first</option>
            <option value="name">Sort: name</option>
          </select>
        </div>

        {resellersLoading ? (
          <div className="glass rounded-[20px]">
            <EmptyState
              title="Loading wallets…"
              description="Fetching the current reseller list."
            />
          </div>
        ) : sortedRows.length === 0 ? (
          <div className="glass rounded-[20px]">
            <EmptyState
              icon={<WalletIcon aria-hidden="true" className="size-5" />}
              title={
                query ? "No resellers match that search" : "No resellers yet"
              }
              description={
                query
                  ? "Try a different name."
                  : "Wallets appear here once resellers are provisioned."
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="glass hidden overflow-x-auto rounded-[20px] md:block">
              <table className="w-full min-w-[700px] text-sm">
                <caption className="sr-only">
                  Resellers with wallet balance, owed accounts, last activity
                  and a top-up action
                </caption>
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "Reseller",
                      "Balance",
                      "Owed accounts",
                      "Last activity",
                    ].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="label-meta px-5 py-3.5 text-left"
                      >
                        {h}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="label-meta px-5 py-3.5 text-right"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((r) => {
                    const summary = summaries[r.id];
                    return (
                      <tr
                        key={r.id}
                        onClick={() => goToDetail(r.id)}
                        className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/30"
                      >
                        <th
                          scope="row"
                          className="px-5 py-4 text-left font-mono text-xs font-normal"
                        >
                          <Link
                            href={`/sip/reseller-wallets/${r.id}`}
                            className="hover:underline"
                          >
                            {r.username}
                          </Link>
                        </th>
                        <td
                          className={cn(
                            "px-5 py-4 tabular-nums font-medium",
                            summary
                              ? summary.balanceUsd >= 0
                                ? "text-positive-foreground"
                                : "text-negative-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {summary ? (
                            formatUsd(summary.balanceUsd)
                          ) : summary === null ? (
                            <MetaTag>No wallet</MetaTag>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {summary ? (
                            <WalletStatusPill
                              owedAccounts={summary.owedAccounts}
                            />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 tabular-nums text-muted-foreground">
                          {summary ? formatDate(summary.updatedAt) : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              disabled={!summary}
                              onClick={(e) => {
                                e.stopPropagation();
                                setToppingUp(r);
                              }}
                              className="glass inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Plus aria-hidden="true" className="size-3.5" />
                              Top up
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="space-y-3 md:hidden">
              {sortedRows.map((r) => {
                const summary = summaries[r.id];
                return (
                  <li key={r.id} className="glass rounded-[20px] p-4">
                    <Link
                      href={`/sip/reseller-wallets/${r.id}`}
                      className="flex items-start justify-between gap-3"
                    >
                      <p className="truncate font-mono text-sm font-medium">
                        {r.username}
                      </p>
                      {summary ? (
                        <span
                          className={cn(
                            "shrink-0 tabular-nums text-sm font-semibold",
                            summary.balanceUsd >= 0
                              ? "text-positive-foreground"
                              : "text-negative-foreground",
                          )}
                        >
                          {formatUsd(summary.balanceUsd)}
                        </span>
                      ) : summary === null ? (
                        <MetaTag className="shrink-0">No wallet</MetaTag>
                      ) : null}
                    </Link>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <dl className="grid flex-1 grid-cols-2 gap-3">
                        <div>
                          <dt className="label-meta">Owed accounts</dt>
                          <dd className="mt-1 text-sm">
                            {summary ? (
                              <WalletStatusPill
                                owedAccounts={summary.owedAccounts}
                              />
                            ) : (
                              "—"
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="label-meta">Last activity</dt>
                          <dd className="mt-1 text-sm tabular-nums">
                            {summary ? formatDate(summary.updatedAt) : "—"}
                          </dd>
                        </div>
                      </dl>
                      <button
                        type="button"
                        disabled={!summary}
                        onClick={() => setToppingUp(r)}
                        className="glass inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus aria-hidden="true" className="size-3.5" />
                        Top up
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <TopUpWalletDialog
        open={!!toppingUp}
        reseller={toppingUp}
        currentBalance={
          toppingUp ? (summaries[toppingUp.id]?.balanceUsd ?? 0) : 0
        }
        onClose={() => setToppingUp(null)}
        onSuccess={() => {
          setToppingUp(null);
          refreshSummaries();
        }}
      />
    </div>
  );
}
