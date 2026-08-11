"use client";

import { useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { EmptyState, PageHeader, StatBlock } from "./primitives";
import { StatusPill } from "./status-pill";
import { useTelephony } from "@/contexts/telephony-context";
import { getEndUsers } from "@/lib/telephony/derived";
import { accountStatus, formatDate } from "@/lib/telephony/status";
import type { ModuleKey } from "@/lib/telephony/types";

const MODULE_LABEL: Record<ModuleKey, string> = { sip: "SIP", esim: "eSIM" };

export function EndUsersView({ module }: { module: ModuleKey }) {
  const { user, visibleAccounts } = useTelephony();
  const [query, setQuery] = useState("");
  const isAdmin = user?.role === "admin";

  const holders = getEndUsers(visibleAccounts, module);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return holders;
    return holders.filter(
      (a) =>
        a.displayName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.sipId.toLowerCase().includes(q),
    );
  }, [holders, query]);

  return (
    <div className="space-y-10">
      <PageHeader
        module={module}
        eyebrow={isAdmin ? "Platform-wide" : "Your customers"}
        title="End users"
        description={
          module === "sip"
            ? "The identities behind every SIP account — a customer-facing view distinct from credential management in Accounts."
            : "eSIM does not have any issued identities yet."
        }
      />

      {module === "esim" ? (
        <div className="glass rounded-[20px]">
          <EmptyState
            icon={<UserRound aria-hidden="true" className="size-5" />}
            title="No eSIM identities yet"
            description="This view mirrors SIP's end-user list once eSIM profiles start being issued."
          />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            <StatBlock label="Total end users" value={holders.length} />
          </section>

          <div className="relative lg:w-80">
            <Search
              aria-hidden="true"
              className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              aria-label="Search end users"
              placeholder="Search name, email or SIP identifier"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="glass h-11 w-full rounded-xl border-0 pl-11 pr-4 text-sm outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {rows.length === 0 ? (
            <div className="glass rounded-[20px]">
              <EmptyState
                title="No end users match"
                description="Try a different search term."
              />
            </div>
          ) : (
            <div className="glass overflow-x-auto rounded-[20px]">
              <table className="w-full min-w-[640px] text-sm">
                <caption className="sr-only">
                  {MODULE_LABEL[module]} end users
                </caption>
                <thead>
                  <tr className="border-b border-border">
                    {["Customer", "SIP identifier", "Status", "Since"].map(
                      (h) => (
                        <th
                          key={h}
                          scope="col"
                          className="label-meta px-5 py-3.5 text-left"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-border last:border-0 hover:bg-accent/30"
                    >
                      <td className="px-5 py-4">
                        <span className="block font-medium">
                          {a.displayName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {a.email}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs">{a.sipId}</td>
                      <td className="px-5 py-4">
                        <StatusPill status={accountStatus(a)} />
                      </td>
                      <td className="px-5 py-4 tabular-nums text-muted-foreground">
                        {formatDate(a.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
