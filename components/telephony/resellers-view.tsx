"use client";

import { Users } from "lucide-react";
import { EmptyState, PageHeader, StatBlock } from "./primitives";
import { useTelephony } from "@/contexts/telephony-context";
import { getResellers } from "@/lib/telephony/derived";
import type { ModuleKey } from "@/lib/telephony/types";

const MODULE_LABEL: Record<ModuleKey, string> = { sip: "SIP", esim: "eSIM" };

export function ResellersView({ module }: { module: ModuleKey }) {
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
        {module === "sip" ? (
          <StatBlock
            label="Accounts created"
            value={rows.reduce((n, r) => n + r.accountCount, 0)}
            tone="accent"
          />
        ) : null}
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
