"use client";

import { useState } from "react";
import {
  KeyRound,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { EmptyState, PageHeader, StatBlock } from "./primitives";
import { StatusPill } from "./status-pill";
import {
  CreateResellerDialog,
  DisableResellerDialog,
  RenewResellerDialog,
  ResetResellerPasswordDialog,
} from "./reseller-dialogs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTelephony } from "@/contexts/telephony-context";
import { formatDate, resellerStatus } from "@/lib/telephony/status";
import { getResellers } from "@/lib/telephony/derived";
import type { AccountStatus, ModuleKey, Reseller } from "@/lib/telephony/types";
import { cn } from "@/lib/utils";

const MODULE_LABEL: Record<ModuleKey, string> = { sip: "SIP", esim: "eSIM" };

export function ResellersView({ module }: { module: ModuleKey }) {
  if (module === "sip") return <SipResellersPanel />;
  return <MockResellersPanel module={module} />;
}

/**
 * eSIM has no backend yet — this stays the original read-only view straight
 * off `MOCK_USERS`, unaffected by the real /api/admins integration below.
 */
function MockResellersPanel({ module }: { module: ModuleKey }) {
  const { user, users, accounts } = useTelephony();

  if (user?.role !== "admin") {
    return (
      <EmptyState
        title="Administrators only"
        description="Reseller management is restricted to platform administrators."
      />
    );
  }

  const rows = getResellers(users, accounts, module);

  return (
    <div className="space-y-10">
      <PageHeader
        module={module}
        eyebrow="Customer management"
        title="Resellers"
        description={`Organisations approved for the ${MODULE_LABEL[module]} module.`}
      />

      <section className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <StatBlock
          label={`${MODULE_LABEL[module]} resellers`}
          value={rows.length}
        />
      </section>

      {rows.length === 0 ? (
        <div className="glass rounded-[20px]">
          <EmptyState
            icon={<Users aria-hidden="true" className="size-5" />}
            title="No resellers yet"
            description={`No organisation has been approved for ${MODULE_LABEL[module]} yet.`}
          />
        </div>
      ) : (
        <div className="glass overflow-x-auto rounded-[20px]">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">
              Resellers with {MODULE_LABEL[module]} access
            </caption>
            <thead>
              <tr className="border-b border-border">
                {["Organisation", "Contact", "Modules"]
                  .concat(module === "sip" ? ["Accounts created"] : [])
                  .map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="label-meta px-5 py-3.5 text-left"
                    >
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ user: reseller, accountCount }) => (
                <tr
                  key={reseller.id}
                  className="border-b border-border last:border-0 hover:bg-accent/30"
                >
                  <td className="px-5 py-4">
                    <span className="block font-medium">
                      {reseller.org ?? reseller.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {reseller.name}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                    {reseller.identifier}
                  </td>
                  <td className="px-5 py-4 uppercase text-xs tracking-wider text-muted-foreground">
                    {reseller.modules.join(" · ")}
                  </td>
                  {module === "sip" ? (
                    <td className="px-5 py-4 tabular-nums">{accountCount}</td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const FILTERS: { key: AccountStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "expiring", label: "Expiring" },
  { key: "disabled", label: "Disabled" },
  { key: "expired", label: "Expired" },
];

const PAGE_SIZE = 8;

/** Real reseller logins, backed by GET/POST/PATCH /api/admins — SIP only. */
function SipResellersPanel() {
  const { user, resellers, resellersLoading, accounts } = useTelephony();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AccountStatus | "all">("all");
  const [sort, setSort] = useState<"expiry" | "created" | "username">("expiry");
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [renewing, setRenewing] = useState<Reseller | null>(null);
  const [resetting, setResetting] = useState<Reseller | null>(null);
  const [toggling, setToggling] = useState<Reseller | null>(null);

  if (user?.role !== "admin") {
    return (
      <EmptyState
        title="Administrators only"
        description="Reseller management is restricted to platform administrators."
      />
    );
  }

  const accountCountFor = (resellerId: string) =>
    accounts.filter((a) => a.createdById === resellerId).length;

  const rows = resellers.filter((r) => {
    const q = query.trim().toLowerCase();
    const matchQ = !q || r.username.toLowerCase().includes(q);
    const matchF = filter === "all" || resellerStatus(r) === filter;
    return matchQ && matchF;
  });

  const sortedRows = [...rows].sort((a, b) => {
    if (sort === "username") return a.username.localeCompare(b.username);
    if (sort === "created")
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    return +new Date(a.expiresAt ?? 0) - +new Date(b.expiresAt ?? 0);
  });

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pageRows = sortedRows.slice(
    current * PAGE_SIZE,
    current * PAGE_SIZE + PAGE_SIZE,
  );

  const statuses = resellers.map(resellerStatus);
  const stats = {
    total: resellers.length,
    active: statuses.filter((s) => s === "active").length,
    expiring: statuses.filter((s) => s === "expiring").length,
    inactive: statuses.filter((s) => s === "disabled" || s === "expired")
      .length,
    accountsCreated: resellers.reduce((n, r) => n + accountCountFor(r.id), 0),
  };

  return (
    <div className="space-y-10">
      <PageHeader
        module="sip"
        eyebrow="Customer management"
        title="Resellers"
        description="Reseller logins provisioned on the Flexisip cluster."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="module-bg inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-transform active:scale-[0.98]"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add reseller
          </button>
        }
      />

      <section
        aria-label="Overview"
        className="grid grid-cols-2 gap-6 lg:grid-cols-4"
      >
        <StatBlock label="SIP resellers" value={stats.total} />
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
        />
      </section>

      <section aria-label="Reseller management" className="space-y-4">
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
            <label className="sr-only" htmlFor="reseller-sort">
              Sort resellers
            </label>
            <select
              id="reseller-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="glass h-9 rounded-full px-3 font-mono text-[11px] tracking-wider uppercase outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="expiry">Sort: expiry</option>
              <option value="created">Sort: newest</option>
              <option value="username">Sort: username</option>
            </select>
          </div>
        </div>

        {resellersLoading ? (
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
                query || filter !== "all"
                  ? "No resellers match those filters"
                  : "No resellers yet"
              }
              description={
                query || filter !== "all"
                  ? "Try a different search term or clear the status filter to see the full list."
                  : "Provision the first reseller login to get started."
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
                ) : (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="module-bg rounded-xl px-4 py-2.5 text-sm font-semibold"
                  >
                    Add the first reseller
                  </button>
                )
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="glass hidden overflow-x-auto rounded-[20px] md:block">
              <table className="w-full min-w-[700px] text-sm">
                <caption className="sr-only">
                  Resellers with status, account counts and management actions
                </caption>
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "Username",
                      "Status",
                      "Expiry",
                      "Created",
                      "Accounts created",
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
                  {pageRows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border last:border-0 hover:bg-accent/30"
                    >
                      <th
                        scope="row"
                        className="px-5 py-4 text-left font-mono text-xs font-normal"
                      >
                        {r.username}
                      </th>
                      <td className="px-5 py-4">
                        <StatusPill status={resellerStatus(r)} />
                      </td>
                      <td className="px-5 py-4 tabular-nums">
                        {r.expiresAt ? formatDate(r.expiresAt) : "—"}
                      </td>
                      <td className="px-5 py-4 tabular-nums text-muted-foreground">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="px-5 py-4 tabular-nums">
                        {accountCountFor(r.id)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setRenewing(r)}
                            className="h-9 rounded-lg bg-secondary px-3 text-xs font-semibold"
                          >
                            Renew
                          </button>
                          <RowMenu
                            reseller={r}
                            onReset={() => setResetting(r)}
                            onToggle={() => setToggling(r)}
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
              {pageRows.map((r) => (
                <li key={r.id} className="glass rounded-[20px] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate font-mono text-sm font-medium">
                      {r.username}
                    </p>
                    <StatusPill
                      status={resellerStatus(r)}
                      className="shrink-0"
                    />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <dt className="label-meta">Expiry</dt>
                      <dd className="mt-1 text-sm tabular-nums">
                        {r.expiresAt ? formatDate(r.expiresAt) : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="label-meta">Accounts created</dt>
                      <dd className="mt-1 text-sm tabular-nums">
                        {accountCountFor(r.id)}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRenewing(r)}
                      className="h-11 flex-1 rounded-xl bg-secondary text-sm font-semibold"
                    >
                      Renew
                    </button>
                    <RowMenu
                      reseller={r}
                      onReset={() => setResetting(r)}
                      onToggle={() => setToggling(r)}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-3">
              <p className="label-meta">
                {current * PAGE_SIZE + 1}–
                {current * PAGE_SIZE + pageRows.length} of {sortedRows.length}
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

      <CreateResellerDialog open={createOpen} onOpenChange={setCreateOpen} />
      <RenewResellerDialog
        reseller={renewing}
        onClose={() => setRenewing(null)}
      />
      <ResetResellerPasswordDialog
        reseller={resetting}
        onClose={() => setResetting(null)}
      />
      <DisableResellerDialog
        reseller={toggling}
        onClose={() => setToggling(null)}
      />
    </div>
  );
}

function RowMenu({
  reseller,
  onReset,
  onToggle,
}: {
  reseller: Reseller;
  onReset: () => void;
  onToggle: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`More actions for ${reseller.username}`}
        className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary md:size-9"
      >
        <MoreHorizontal aria-hidden="true" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={onReset} className="gap-2">
          <KeyRound aria-hidden="true" className="size-4" />
          Reset password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onToggle} className="gap-2">
          {reseller.status === "disabled" ? (
            <PlayCircle aria-hidden="true" className="size-4" />
          ) : (
            <PauseCircle aria-hidden="true" className="size-4" />
          )}
          {reseller.status === "disabled"
            ? "Reactivate reseller"
            : "Disable reseller"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
