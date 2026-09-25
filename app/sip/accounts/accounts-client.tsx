"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  Send,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import { AppShell } from "@/components/telephony/app-shell";
import {
  EmptyState,
  PageHeader,
  StatBlock,
} from "@/components/telephony/primitives";
import { StatusPill } from "@/components/telephony/status-pill";
import {
  CreateAccountDialog,
  DeleteDialog,
  DisableDialog,
  ReassignDialog,
  RequestAccountsDialog,
} from "@/components/telephony/account-dialogs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTelephony } from "@/contexts/telephony-context";
import { accountStatus, formatDate } from "@/lib/telephony/status";
import type { AccountStatus, SipAccount } from "@/lib/telephony/types";
import { cn } from "@/lib/utils";

const FILTERS: { key: AccountStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "expiring", label: "Expiring" },
  { key: "disabled", label: "Disabled" },
  { key: "expired", label: "Expired" },
];

const PAGE_SIZE = 8;

export function SipAccountsClient() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <SipAccountsPage />
      </Suspense>
    </AppShell>
  );
}

function SipAccountsPage() {
  const { user, visibleAccounts, accountsLoading, hasModule, resellers } =
    useTelephony();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resellerFilter = searchParams.get("reseller");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AccountStatus | "all">("all");
  const [sort, setSort] = useState<"expiry" | "created" | "identifier">(
    "expiry",
  );
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [toggling, setToggling] = useState<SipAccount | null>(null);
  const [deleting, setDeleting] = useState<SipAccount | null>(null);
  const [reassigning, setReassigning] = useState<SipAccount | null>(null);

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

  const stats = useMemo(() => {
    const s = accountsInScope.map(accountStatus);
    return {
      total: accountsInScope.length,
      active: s.filter((x) => x === "active").length,
      expiring: s.filter((x) => x === "expiring").length,
      inactive: s.filter((x) => x === "disabled" || x === "expired").length,
    };
  }, [accountsInScope]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = accountsInScope.filter((a) => {
      const matchQ = !q || a.sipId.toLowerCase().includes(q);
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

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(
    current * PAGE_SIZE,
    current * PAGE_SIZE + PAGE_SIZE,
  );

  if (!hasModule("sip")) {
    return (
      <EmptyState
        title="SIP module not enabled"
        description="Your organisation is not approved for SIP provisioning. Request access from the Admin Contol Panel."
      />
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader
        module="sip"
        eyebrow={isAdmin ? "Platform-wide" : "Your accounts"}
        title="SIP accounts"
        description={
          isAdmin
            ? "Every identity registered on the cluster, across all resellers."
            : "Only the accounts your organisation created are shown here."
        }
        actions={
          isAdmin ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="module-bg inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-transform active:scale-[0.98]"
            >
              <Plus aria-hidden="true" className="size-4" />
              New account
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setRequestOpen(true)}
              className="module-bg inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-transform active:scale-[0.98]"
            >
              <Send aria-hidden="true" className="size-4" />
              Request account(s)
            </button>
          )
        }
      />

      {resellerFilterName ? (
        <div className="glass flex items-center justify-between gap-3 rounded-xl px-4 py-2.5">
          <p className="text-sm">
            Showing accounts owned by{" "}
            <span className="font-semibold">{resellerFilterName}</span>
          </p>
          <button
            type="button"
            onClick={() => router.push("/sip/accounts")}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-secondary px-3 text-xs font-semibold"
          >
            <X aria-hidden="true" className="size-3.5" />
            Clear
          </button>
        </div>
      ) : null}

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

      <section aria-label="Account management" className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative lg:w-80">
            <Search
              aria-hidden="true"
              className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              aria-label="Search accounts"
              placeholder="Search by SIP identifier"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
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
                  onClick={() => {
                    setFilter(f.key);
                    setPage(0);
                  }}
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
              Sort accounts
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
            {isAdmin ? (
              <>
                <label className="sr-only" htmlFor="owner-filter">
                  Filter by owner
                </label>
                <select
                  id="owner-filter"
                  value={resellerFilter ?? "all"}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPage(0);
                    router.push(
                      value === "all"
                        ? "/sip/accounts"
                        : `/sip/accounts?reseller=${value}`,
                    );
                  }}
                  className="glass h-9 rounded-full px-3 font-mono text-[11px] tracking-wider uppercase outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">Owned by: all</option>
                  {resellers.map((r) => (
                    <option key={r.id} value={r.id}>
                      Owned by: {r.username}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
          </div>
        </div>

        {accountsLoading ? (
          <div className="glass rounded-[20px]">
            <EmptyState
              title="Loading accounts…"
              description="Fetching the current SIP account list from the cluster."
            />
          </div>
        ) : rows.length === 0 ? (
          <div className="glass rounded-[20px]">
            <EmptyState
              title={
                query || filter !== "all"
                  ? "No accounts match those filters"
                  : "No accounts yet"
              }
              description={
                query || filter !== "all"
                  ? "Try a different search term or clear the status filter to see the full list."
                  : isAdmin
                    ? "Provision the first SIP identity to start managing registrations here."
                    : "Request accounts from operations to get started."
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
                ) : isAdmin ? (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="module-bg rounded-xl px-4 py-2.5 text-sm font-semibold"
                  >
                    Provision an account
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRequestOpen(true)}
                    className="module-bg rounded-xl px-4 py-2.5 text-sm font-semibold"
                  >
                    Request account(s)
                  </button>
                )
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="glass hidden overflow-x-auto rounded-[20px] md:block">
              <table className="w-full min-w-[860px] text-sm">
                <caption className="sr-only">
                  SIP accounts with status, expiry and management actions
                </caption>
                <thead>
                  <tr className="border-b border-border">
                    {["Identifier", "Email", "Status", "Expiry", "Created"]
                      .concat(isAdmin ? ["Owned by"] : [])
                      .map((h) => (
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
                  {pageRows.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-border last:border-0 hover:bg-accent/30"
                    >
                      <th
                        scope="row"
                        className="px-5 py-4 text-left font-mono text-xs font-normal"
                      >
                        {a.sipId}
                      </th>
                      <td className="px-5 py-4 text-muted-foreground">
                        {a.email || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill status={accountStatus(a)} />
                      </td>
                      <td className="px-5 py-4 tabular-nums">
                        {formatDate(a.expiresAt)}
                      </td>
                      <td className="px-5 py-4 tabular-nums text-muted-foreground">
                        {formatDate(a.createdAt)}
                      </td>
                      {isAdmin ? (
                        <td className="px-5 py-4 text-muted-foreground">
                          {a.createdByName}
                        </td>
                      ) : null}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end">
                          <RowMenu
                            account={a}
                            isAdmin={isAdmin}
                            onToggle={() => setToggling(a)}
                            onDelete={() => setDeleting(a)}
                            onReassign={() => setReassigning(a)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="space-y-3 md:hidden">
              {pageRows.map((a) => (
                <li key={a.id} className="glass rounded-[20px] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-medium">
                        {a.sipId}
                      </p>
                      {a.email ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {a.email}
                        </p>
                      ) : null}
                    </div>
                    <StatusPill
                      status={accountStatus(a)}
                      className="shrink-0"
                    />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <dt className="label-meta">Expiry</dt>
                      <dd className="mt-1 text-sm tabular-nums">
                        {formatDate(a.expiresAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="label-meta">
                        {isAdmin ? "Owned by" : "Created"}
                      </dt>
                      <dd className="mt-1 text-sm">
                        {isAdmin ? a.createdByName : formatDate(a.createdAt)}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex items-center justify-end">
                    <RowMenu
                      account={a}
                      isAdmin={isAdmin}
                      onToggle={() => setToggling(a)}
                      onDelete={() => setDeleting(a)}
                      onReassign={() => setReassigning(a)}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-3">
              <p className="label-meta">
                {current * PAGE_SIZE + 1}–
                {current * PAGE_SIZE + pageRows.length} of {rows.length}
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

      <CreateAccountDialog open={createOpen} onOpenChange={setCreateOpen} />
      <RequestAccountsDialog open={requestOpen} onOpenChange={setRequestOpen} />
      <DisableDialog account={toggling} onClose={() => setToggling(null)} />
      <DeleteDialog account={deleting} onClose={() => setDeleting(null)} />
      <ReassignDialog
        account={reassigning}
        onClose={() => setReassigning(null)}
      />
    </div>
  );
}

function RowMenu({
  account,
  isAdmin,
  onToggle,
  onDelete,
  onReassign,
}: {
  account: SipAccount;
  isAdmin: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onReassign: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`More actions for ${account.sipId}`}
        className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary md:size-9"
      >
        <MoreHorizontal aria-hidden="true" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={onToggle} className="gap-2">
          {account.disabled ? (
            <PlayCircle aria-hidden="true" className="size-4" />
          ) : (
            <PauseCircle aria-hidden="true" className="size-4" />
          )}
          {account.disabled ? "Re-enable account" : "Disable account"}
        </DropdownMenuItem>
        {isAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onReassign} className="gap-2">
              <UserCog aria-hidden="true" className="size-4" />
              Reassign owner
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onDelete}
              className="gap-2 text-negative-foreground focus:text-negative-foreground"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Delete permanently
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
