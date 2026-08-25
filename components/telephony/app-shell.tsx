"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useTelephony } from "@/contexts/telephony-context";
import { PRIMARY_AREAS } from "@/lib/telephony/nav-config";
import { activeAreaId, PrimaryRail } from "./primary-rail";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { SecondaryColumn } from "./secondary-column";
import { ThemeToggle } from "./theme-toggle";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, hydrated } = useTelephony();
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.push("/");
    else if (user.role === "enduser") router.push("/my-account");
  }, [hydrated, user, router]);

  const areaId = activeAreaId(pathname) ?? "overview";
  const area = PRIMARY_AREAS.find((a) => a.id === areaId);
  const accent = area?.accent ?? "success";

  // Keep the module identity on <html> so portalled glass surfaces
  // (dialogs, drawers, menus) inherit the same contextual accent.
  useEffect(() => {
    document.documentElement.dataset["module"] = accent;
  }, [accent]);

  if (!hydrated || !user || user.role === "enduser") {
    return (
      <div className="grid min-h-dvh place-items-center">
        <p className="label-meta">Loading workspace…</p>
      </div>
    );
  }

  return (
    <div data-module={accent} className="relative min-h-dvh md:flex">
      {/* ambient command-center wash, tinted by the active area's accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 opacity-70 transition-opacity duration-500"
        style={{
          backgroundImage:
            "radial-gradient(58rem 34rem at 12% -8%, color-mix(in oklab, var(--module) var(--ambient-wash-tint), transparent), transparent 70%)",
        }}
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* Desktop: primary icon rail + reflowing secondary nav — hover a workspace
          icon to open it; leaving the whole rail+panel region closes it. */}
      <div
        className="hidden md:flex"
        onMouseLeave={() => setHoveredAreaId(null)}
      >
        <PrimaryRail
          hoveredAreaId={hoveredAreaId}
          onHoverArea={setHoveredAreaId}
        />
        {/* Resting state shows the workspace you're actually in (SIP/eSIM
            stay open without hovering); hovering another icon previews it. */}
        <SecondaryColumn areaId={hoveredAreaId ?? areaId} />
      </div>

      {/* Mobile top bar */}
      <div className="glass sticky top-0 z-40 flex items-center justify-between border-x-0 border-t-0 px-4 py-4 md:hidden">
        <Brand />
        <ThemeToggle />
      </div>

      <main
        id="main"
        className="min-w-0 flex-1 px-4 pb-[var(--mobile-nav-clearance)] mt-5 md:px-8 md:py-8 md:pb-10 lg:px-12"
      >
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>

      <MobileBottomNav />
    </div>
  );
}

export function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        aria-hidden="true"
        className="module-bg grid size-9 shrink-0 place-items-center rounded-[12px] font-display text-sm font-bold"
      >
        AC
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-sm font-bold tracking-tight">
          Admin Control
        </span>
        {!compact ? (
          <span className="label-meta block mt-0.5">Operations</span>
        ) : null}
      </span>
    </div>
  );
}
