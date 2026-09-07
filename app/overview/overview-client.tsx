"use client";

import Link from "next/link";
import { ArrowUpRight, Lock, PhoneCall } from "lucide-react";
import { AppShell } from "@/components/telephony/app-shell";
import { PageHeader } from "@/components/telephony/primitives";
import { MetaTag, ModuleTag } from "@/components/telephony/status-pill";
import { useTelephony } from "@/contexts/telephony-context";
import { accountStatus } from "@/lib/telephony/status";
import type { ModuleKey } from "@/lib/telephony/types";

export function OverviewClient() {
  return (
    <AppShell>
      <OverviewPage />
    </AppShell>
  );
}

function OverviewPage() {
  const { user, visibleAccounts, hasModule } = useTelephony();
  const sipCount = visibleAccounts.length;
  const attention = visibleAccounts.filter((a) => {
    const s = accountStatus(a);
    return s === "expiring" || s === "expired" || s === "disabled";
  }).length;

  return (
    <div className="space-y-10 ">
      <PageHeader
        eyebrow={
          user?.role === "admin" ? "Administrator" : "Reseller workspace"
        }
        title={`Welcome back, ${user?.name.split(" ")[0]}`}
        description={
          user?.role === "admin"
            ? "You have platform-wide visibility across every module, reseller and account."
            : "You see and manage only the accounts you created, within the modules approved for your organisation."
        }
      />

      <section aria-labelledby="modules" className="space-y-4">
        <h2 id="modules" className="label-meta">
          Modules
        </h2>
        <div className="grid gap-4">
          {hasModule("sip") ? (
            <ModuleCard
              module="sip"
              to="/sip/dashboard"
              icon={<PhoneCall aria-hidden="true" className="size-5" />}
              title="SIP Account Panel"
              description="Provision, renew, disable and audit SIP identities on the Flexisip cluster."
              stat={sipCount}
              statLabel={
                user?.role === "admin"
                  ? "Accounts on platform"
                  : "Accounts you created"
              }
              tags={[
                <ModuleTag key="mod" module="sip" />,
                <MetaTag key="att">{attention} need attention</MetaTag>,
              ]}
            />
          ) : (
            <LockedCard
              module="sip"
              icon={<PhoneCall aria-hidden="true" className="size-5" />}
              title="SIP Account Panel"
              reason="SIP provisioning requires a reseller agreement covering voice traffic and emergency-call obligations."
            />
          )}
        </div>
      </section>
    </div>
  );
}

function ModuleCard({
  module,
  to,
  icon,
  title,
  description,
  stat,
  statLabel,
  tags,
}: {
  module: ModuleKey;
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  stat: number;
  statLabel: string;
  tags: React.ReactNode[];
}) {
  return (
    <Link
      data-module={module}
      href={to}
      className="dashboard-module-card group flex flex-col justify-between gap-8 rounded-[20px] p-6 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 sm:p-7"
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <span className="module-tint grid size-11 place-items-center rounded-2xl transition-colors group-hover:bg-module group-hover:text-ink">
            {icon}
          </span>
          <span className="flex flex-wrap justify-end gap-2">{tags}</span>
        </div>
        <h3 className="mt-5 font-display text-xl font-bold tracking-tight text-module-strong">
          {title}
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="stat-figure block text-4xl text-module">{stat}</span>
          <span className="label-meta mt-1.5 block">{statLabel}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-module-strong">
          Open panel
          <ArrowUpRight
            aria-hidden="true"
            className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </div>
    </Link>
  );
}

function LockedCard({
  module,
  icon,
  title,
  reason,
}: {
  module: ModuleKey;
  icon: React.ReactNode;
  title: string;
  reason: string;
}) {
  // A locked module here always means "not approved as a reseller for it" —
  // pre-select that combination on the public request form.
  const requestHref = `/request?type=reseller&module=${module}`;
  return (
    <div
      data-module={module}
      className="glass flex flex-col justify-between gap-8 rounded-[20px] p-6 sm:p-7"
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-11 place-items-center rounded-2xl bg-neutral-pill text-muted-foreground">
            {icon}
          </span>
          <MetaTag>
            <Lock aria-hidden="true" className="mr-1.5 size-3" />
            Access not enabled
          </MetaTag>
        </div>
        <h3 className="mt-5 font-display text-xl font-bold tracking-tight">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {reason}
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2" aria-hidden="true">
          <div className="h-2 w-3/4 rounded-full bg-muted" />
          <div className="h-2 w-1/2 rounded-full bg-muted" />
          <div className="h-2 w-2/3 rounded-full bg-muted" />
        </div>
        <Link
          href={requestHref}
          className="module-bg inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-transform active:scale-[0.99] sm:w-auto"
        >
          Request access
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </div>
  );
}
