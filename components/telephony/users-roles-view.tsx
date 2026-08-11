"use client";

import { EmptyState, PageHeader } from "./primitives";
import { MetaTag } from "./status-pill";
import { useTelephony } from "@/contexts/telephony-context";
import type { ModuleKey } from "@/lib/telephony/types";

const MODULE_LABEL: Record<ModuleKey, string> = { sip: "SIP", esim: "eSIM" };

export function UsersRolesView({ module }: { module: ModuleKey }) {
  const { user, users } = useTelephony();

  if (user?.role !== "admin") {
    return (
      <EmptyState
        title="Administrators only"
        description="User and role management is restricted to platform administrators."
      />
    );
  }

  const rows = users.filter(
    (u) => u.role === "admin" || u.modules.includes(module),
  );

  return (
    <div className="space-y-10">
      <PageHeader
        module={module}
        eyebrow="Access control"
        title="Users & roles"
        description={`Every platform user with visibility into ${MODULE_LABEL[module]}, and the role that grants it.`}
      />

      <div className="glass overflow-x-auto rounded-[20px]">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="sr-only">
            Users with {MODULE_LABEL[module]} access
          </caption>
          <thead>
            <tr className="border-b border-border">
              {["Name", "Identifier", "Role", "Modules"].map((h) => (
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
            {rows.map((u) => (
              <tr
                key={u.id}
                className="border-b border-border last:border-0 hover:bg-accent/30"
              >
                <td className="px-5 py-4">
                  <span className="block font-medium">{u.name}</span>
                  {u.org ? (
                    <span className="text-xs text-muted-foreground">
                      {u.org}
                    </span>
                  ) : null}
                </td>
                <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                  {u.identifier}
                </td>
                <td className="px-5 py-4">
                  <MetaTag>{u.role}</MetaTag>
                </td>
                <td className="px-5 py-4 uppercase text-xs tracking-wider text-muted-foreground">
                  {u.role === "admin" ? "all" : u.modules.join(" · ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Role and module grants are managed by platform operations during the
        approval flow. This view is read-only in the current build.
      </p>
    </div>
  );
}
