"use client";

import Link from "next/link";
import { ArrowUpRight, Lock, Signal } from "lucide-react";
import { AppShell } from "@/components/telephony/app-shell";
import { PageHeader } from "@/components/telephony/primitives";
import { MetaTag } from "@/components/telephony/status-pill";
import { useTelephony } from "@/contexts/telephony-context";

export function EsimDashboardClient() {
  return (
    <AppShell>
      <EsimDashboardPage />
    </AppShell>
  );
}

function EsimDashboardPage() {
  const { hasModule } = useTelephony();

  if (!hasModule("esim")) {
    return (
      <div className="space-y-8 ">
        <PageHeader
          module="esim"
          eyebrow="Restricted module"
          title="eSIM dashboard"
          description="This module is live on the platform, but your organisation has not been enabled for it yet."
        />
        <div className="glass rounded-[20px] p-6 sm:p-8">
          <MetaTag>
            <Lock aria-hidden="true" className="mr-1.5 size-3" />
            Access not enabled
          </MetaTag>
          <h2 className="mt-5 font-display text-xl font-bold">
            What you&apos;d get with access
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {[
              "Profile inventory with activation state per ICCID",
              "Remote provisioning and QR issuance for your customers",
              "Data plan assignment, top-ups and expiry control",
              "The same renew / disable / audit model used in the SIP panel",
            ].map((line) => (
              <li key={line} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-module"
                />
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Access is restricted because eSIM distribution requires a completed
            KYC and compliance review per organisation. Once that clears,
            operations flips the module on and this page becomes your workspace.
          </p>
          <Link
            href="/request"
            className="module-bg mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold sm:w-auto"
          >
            Request eSIM access
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        module="esim"
        eyebrow="Module — rollout in progress"
        title="eSIM dashboard"
        description="Your organisation is approved. Provisioning tooling lands with the next infrastructure release."
      />
      <div className="glass-module rounded-[20px] p-8">
        <span className="module-tint grid size-11 place-items-center rounded-2xl">
          <Signal aria-hidden="true" className="size-5" />
        </span>
        <h2 className="mt-5 font-display text-xl font-bold">
          No profiles provisioned yet
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
          The eSIM workspace mirrors the SIP panel: an overview strip, a profile
          table with status and expiry, and the same renew / disable / delete
          hierarchy. Nothing has been issued to your organisation so far.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            ["Profiles", "0"],
            ["Active", "0"],
            ["Awaiting activation", "0"],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="label-meta">{label}</p>
              <p className="stat-figure mt-1.5 text-3xl text-muted-foreground">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
