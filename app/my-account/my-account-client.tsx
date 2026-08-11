"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut, PhoneCall } from "lucide-react";
import { useTelephony } from "@/contexts/telephony-context";
import { Brand } from "@/components/telephony/app-shell";
import { ThemeToggle } from "@/components/telephony/theme-toggle";
import { StatusPill } from "@/components/telephony/status-pill";
import { accountStatus, daysUntil, formatDate } from "@/lib/telephony/status";

const MESSAGE = {
  active: "Your account is active. Calls can be placed and received as normal.",
  expiring:
    "Your account expires soon. Contact your provider to renew before the date below.",
  disabled:
    "Your account is currently disabled. It still exists and can be re-enabled by your provider.",
  expired:
    "Your account has expired. Contact your provider to restore service.",
} as const;

export function MyAccountClient() {
  const { user, hydrated, visibleAccounts, signOut } = useTelephony();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.push("/");
    else if (user.role !== "enduser") router.push("/overview");
  }, [hydrated, user, router]);

  const account = visibleAccounts[0];

  if (!hydrated || !user || user.role !== "enduser") {
    return (
      <div className="grid min-h-dvh place-items-center">
        <p className="label-meta">Loading your account…</p>
      </div>
    );
  }

  const status = account ? accountStatus(account) : "expired";
  const days = account ? daysUntil(account.expiresAt) : 0;

  return (
    <div className="min-h-dvh px-5 py-6 md:px-10 md:py-10">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between">
        <Brand compact />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => {
              signOut();
              router.push("/");
            }}
            aria-label="Sign out"
            className="grid size-11 place-items-center rounded-full bg-secondary"
          >
            <LogOut aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      <main id="main" className="mx-auto mt-12 w-full max-w-xl pb-16">
        <p className="label-meta">Account holder</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
          {user.name}
        </h1>

        {account ? (
          <section className="mt-8 glass rounded-[20px] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-11 place-items-center rounded-2xl module-tint">
                <PhoneCall aria-hidden="true" className="size-5" />
              </span>
              <StatusPill status={status} />
            </div>

            <p className="label-meta mt-6">SIP identifier</p>
            <p className="mt-2 font-mono text-lg break-all">{account.sipId}</p>

            <p className="mt-7 text-sm leading-relaxed">{MESSAGE[status]}</p>

            <dl className="mt-7 grid gap-6 border-t border-border pt-6 sm:grid-cols-2">
              <div>
                <dt className="label-meta">
                  {status === "expired" ? "Expired on" : "Valid until"}
                </dt>
                <dd className="stat-figure mt-2 text-2xl">
                  {formatDate(account.expiresAt)}
                </dd>
                <dd className="mt-1.5 text-xs text-muted-foreground">
                  {status === "expired"
                    ? `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`
                    : `${days} day${days === 1 ? "" : "s"} remaining`}
                </dd>
              </div>
              <div>
                <dt className="label-meta">Display name</dt>
                <dd className="mt-2 text-sm">{account.displayName}</dd>
                <dd className="mt-1.5 text-xs text-muted-foreground">
                  {account.email}
                </dd>
              </div>
            </dl>
          </section>
        ) : (
          <section className="mt-8 glass rounded-[20px] p-8">
            <p className="font-display text-lg font-bold">
              No account is linked to this login
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Contact your provider so they can attach your SIP identity to
              these credentials.
            </p>
          </section>
        )}

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Renewals and changes are handled by the provider that issued your
          account. This page is read-only.
        </p>
      </main>
    </div>
  );
}
