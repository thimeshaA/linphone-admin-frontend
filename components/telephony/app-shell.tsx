"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, MoreHorizontal } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTelephony } from "@/contexts/telephony-context";
import { PRIMARY_AREAS } from "@/lib/telephony/nav-config";
import { permissionsFor } from "@/lib/telephony/permissions";
import { cn } from "@/lib/utils";
import { activeAreaId, visibleAreas, PrimaryRail } from "./primary-rail";
import { SecondaryColumn } from "./secondary-column";
import { ThemeToggle } from "./theme-toggle";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, hydrated, signOut, requests } = useTelephony();
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

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

  const perms = permissionsFor(user);
  const mobileAreas = visibleAreas(perms);

  return (
    <div data-module={accent} className="relative min-h-dvh md:flex">
      {/* ambient command-center wash, tinted by the active area's accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 opacity-70 transition-opacity duration-500"
        style={{
          backgroundImage:
            "radial-gradient(58rem 34rem at 12% -8%, color-mix(in oklab, var(--module) 16%, transparent), transparent 70%)",
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

      <main
        id="main"
        className="min-w-0 flex-1 px-4 pb-28 mt-5 md:px-8 md:py-8 md:pb-10 lg:px-12"
      >
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>

      {/* Mobile: 4 tabs — Overview, SIP, eSIM, and a More dock for the rest */}
      {(() => {
        const primaryIds = ["overview", "sip", "esim"];
        const primaryMobileAreas = mobileAreas.filter((a) =>
          primaryIds.includes(a.id),
        );
        const moreAreas = mobileAreas.filter((a) => !primaryIds.includes(a.id));
        const moreActive = moreAreas.some((a) => a.id === areaId);
        const pending = requests.filter((r) => r.status === "pending").length;

        return (
          <>
            {moreOpen ? (
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMoreOpen(false)}
                className="fixed inset-0 z-30 bg-black/40 md:hidden"
              />
            ) : null}
            <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
              {moreOpen && moreAreas.length > 0 ? (
                <div className="glass-strong mx-3 mb-2 flex flex-col gap-1 rounded-[20px] p-2">
                  {moreAreas.map((a) => {
                    const active = a.id === areaId;
                    return (
                      <Link
                        key={a.id}
                        href={a.defaultRoute}
                        data-module={a.accent}
                        onClick={() => setMoreOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                          active
                            ? "glass-module text-module"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                        )}
                      >
                        <a.icon
                          aria-hidden="true"
                          className="size-4 shrink-0"
                        />
                        {a.label}
                        {a.id === "approvals" && pending > 0 ? (
                          <span className="module-bg ml-auto grid size-5 place-items-center rounded-full font-mono text-[10px] leading-none">
                            {pending}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              ) : null}

              <nav
                aria-label="Primary"
                className="glass glass-hairline overflow-x-auto border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)]"
              >
                <ul className="mx-auto flex min-w-max">
                  {primaryMobileAreas.map((a) => {
                    const active = a.id === areaId;
                    return (
                      <li key={a.id} className="flex-1">
                        <Link
                          href={a.defaultRoute}
                          data-module={a.accent}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            "relative flex min-h-14 min-w-16 flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium transition-colors",
                            active ? "text-module" : "text-muted-foreground",
                          )}
                        >
                          {active ? (
                            <span
                              aria-hidden="true"
                              className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-module"
                            />
                          ) : null}
                          <a.icon aria-hidden="true" className="size-5" />
                          {a.label}
                        </Link>
                      </li>
                    );
                  })}
                  {moreAreas.length > 0 ? (
                    <li className="flex-1">
                      <button
                        type="button"
                        onClick={() => setMoreOpen((v) => !v)}
                        aria-expanded={moreOpen}
                        aria-label="More"
                        className={cn(
                          "relative flex min-h-14 min-w-16 flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium transition-colors",
                          moreOpen || moreActive
                            ? "text-module"
                            : "text-muted-foreground",
                        )}
                      >
                        {moreOpen || moreActive ? (
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-module"
                          />
                        ) : null}
                        <MoreHorizontal aria-hidden="true" className="size-5" />
                        More
                      </button>
                    </li>
                  ) : null}
                </ul>
              </nav>
            </div>
          </>
        );
      })()}
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
