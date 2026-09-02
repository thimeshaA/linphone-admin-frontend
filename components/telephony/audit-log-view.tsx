"use client";

import { ScrollText } from "lucide-react";
import { EmptyState, PageHeader } from "./primitives";
import { MetaTag } from "./status-pill";
import { useTelephony } from "@/contexts/telephony-context";
import type { AuditAction, ModuleKey } from "@/lib/telephony/types";

const MODULE_LABEL: Record<ModuleKey, string> = { sip: "SIP" };

const ACTION_LABEL: Record<AuditAction, string> = {
  "account.created": "Account created",
  "account.renewed": "Account renewed",
  "account.disabled": "Account disabled",
  "account.enabled": "Account re-enabled",
  "account.deleted": "Account deleted",
  "account.reassigned": "Account reassigned",
  "reseller.created": "Reseller created",
  "reseller.renewed": "Reseller renewed",
  "reseller.password_reset": "Reseller password reset",
  "reseller.disabled": "Reseller disabled",
  "reseller.enabled": "Reseller re-enabled",
};

type Scope = "reseller" | "account";

const SCOPE_COPY: Record<
  Scope,
  { eyebrow: string; title: string; description: string }
> = {
  reseller: {
    eyebrow: "Reseller management",
    title: "Reseller audit logs",
    description:
      "Every create, renew, disable and password action recorded for reseller logins this session.",
  },
  account: {
    eyebrow: "Account management",
    title: "Account audit logs",
    description:
      "Every create, renew, disable and delete action recorded for accounts this session.",
  },
};

export function AuditLogView({
  module,
  scope,
}: {
  module: ModuleKey;
  /** Restricts to reseller.* or account.* actions — omit for the unified view. */
  scope?: Scope;
}) {
  const { user, auditEvents } = useTelephony();

  if (user?.role !== "admin") {
    return (
      <EmptyState
        title="Administrators only"
        description="The audit trail is restricted to platform administrators."
      />
    );
  }

  const rows = auditEvents.filter(
    (e) => e.module === module && (!scope || e.action.startsWith(`${scope}.`)),
  );
  const copy = scope ? SCOPE_COPY[scope] : null;

  return (
    <div className="space-y-10">
      <PageHeader
        module={module}
        eyebrow={copy?.eyebrow ?? "Accountability"}
        title={copy?.title ?? "Audit logs"}
        description={
          copy?.description ??
          `Every create, renew, disable, delete and approval decision recorded for ${MODULE_LABEL[module]} this session.`
        }
      />

      {rows.length === 0 ? (
        <div className="glass rounded-[20px]">
          <EmptyState
            icon={<ScrollText aria-hidden="true" className="size-5" />}
            title="No activity recorded yet"
            description="Actions taken on this module during your session will appear here, newest first."
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((e) => (
            <li key={e.id} className="glass rounded-[20px] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <MetaTag>{ACTION_LABEL[e.action]}</MetaTag>
                  </div>
                  <p className="mt-3 font-display text-base font-bold tracking-tight">
                    {e.target}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    by {e.actorName}
                    {e.detail ? ` — ${e.detail}` : ""}
                  </p>
                </div>
                <span className="label-meta shrink-0">
                  {new Date(e.at).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
