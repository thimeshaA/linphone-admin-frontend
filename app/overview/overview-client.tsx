"use client";

import Link from "next/link";
import { ArrowUpRight, Lock, PhoneCall, Signal } from "lucide-react";
import { AppShell } from "@/components/telephony/app-shell";
import { PageHeader } from "@/components/telephony/primitives";
import { MetaTag, ModuleTag } from "@/components/telephony/status-pill";
import { useTelephony } from "@/contexts/telephony-context";
import { accountStatus } from "@/lib/telephony/status";

export function OverviewClient() {
  return (
    <AppShell>
      <OverviewPage />
    </AppShell>
  );
}

function OverviewPage() {
  const { user, visibleAccounts, hasModule, requests } = useTelephony();
  const sipCount = visibleAccounts.length;
  const attention = visibleAccounts.filter((a) => {
    const s = accountStatus(a);
    return s === "expiring" || s === "expired" || s === "disabled";
  }).length;
  const pending = requests.filter((r) => r.status === "pending").length;

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
        <div className="grid gap-4 lg:grid-cols-2">
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
              reason="Your organisation is approved for eSIM only. SIP provisioning requires a separate reseller agreement covering voice traffic and emergency-call obligations."
            />
          )}

          {hasModule("esim") ? (
            <ModuleCard
              module="esim"
              to="/esim/dashboard"
              icon={<Signal aria-hidden="true" className="size-5" />}
              title="eSIM Panel"
              description="Profile inventory, activation and data plan management for embedded SIM."
              stat={0}
              statLabel="Profiles provisioned"
              tags={[
                <ModuleTag key="mod" module="esim" />,
                <MetaTag key="soon">Rollout in progress</MetaTag>,
              ]}
            />
          ) : (
            <LockedCard
              module="esim"
              icon={<Signal aria-hidden="true" className="size-5" />}
              title="eSIM Panel"
              reason="eSIM management is running, but access is granted per-organisation after a compliance and KYC review. Submit a request and operations will enable the module on your account."
            />
          )}
        </div>
      </section>

      {user?.role === "admin" ? (
        <section aria-labelledby="queue-summary" className="space-y-4">
          <h2 id="queue-summary" className="label-meta">
            Needs a decision
          </h2>
          <Link
            href="/approvals"
            className="glass flex items-center justify-between gap-4 rounded-[20px] px-6 py-5 transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="min-w-0">
              <p className="font-display text-lg font-bold">
                {pending} request{pending === 1 ? "" : "s"} waiting in the
                approval queue
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Reseller applications and account requests from the public
                intake form.
              </p>
            </div>
            <ArrowUpRight
              aria-hidden="true"
              className="size-5 shrink-0 text-module"
            />
          </Link>
        </section>
      ) : null}
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
  module: "sip" | "esim";
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
      className="glass-module group flex flex-col justify-between gap-8 rounded-[20px] p-6 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 sm:p-7"
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <span className="module-tint grid size-11 place-items-center rounded-2xl transition-colors group-hover:bg-module group-hover:text-background">
            {icon}
          </span>
          <span className="flex flex-wrap justify-end gap-2">{tags}</span>
        </div>
        <h3 className="mt-5 font-display text-xl font-bold tracking-tight">
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
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-module">
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
  module: "sip" | "esim";
  icon: React.ReactNode;
  title: string;
  reason: string;
}) {
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
          href="/request"
          className="module-bg inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-transform active:scale-[0.99] sm:w-auto"
        >
          Request access
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </div>
  );
}
