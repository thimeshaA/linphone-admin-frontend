"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_AREAS, type PrimaryArea } from "@/lib/telephony/nav-config";
import { hasPermission, permissionsFor } from "@/lib/telephony/permissions";
import { useTelephony } from "@/contexts/telephony-context";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { RoleSwitcher } from "./role-switcher";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function activeAreaId(pathname: string): string | null {
  const match = PRIMARY_AREAS.find(
    (a) => pathname === a.routeMatch || pathname.startsWith(`${a.routeMatch}/`),
  );
  return match?.id ?? null;
}

export function visibleAreas(perms: Set<string>): PrimaryArea[] {
  return PRIMARY_AREAS.filter((a) => hasPermission(perms, a.permission));
}

export function PrimaryRail({
  hoveredAreaId,
  onHoverArea,
}: {
  hoveredAreaId: string | null;
  onHoverArea: (id: string | null) => void;
}) {
  const { user } = useTelephony();
  const pathname = usePathname();
  const perms = permissionsFor(user);
  const areas = visibleAreas(perms);
  const activeId = activeAreaId(pathname);

  return (
    <nav
      aria-label="Primary"
      className="glass glass-hairline sticky top-0 z-10 flex h-dvh w-20 shrink-0 flex-col items-center gap-1 border-y-0 border-l-0 py-6"
    >
      <Link
        href="/overview"
        aria-label="Telephony Operations — overview"
        className="mb-5 grid size-10 shrink-0 place-items-center"
      >
        <Logo className="h-8 w-auto" />
      </Link>

      <ul className="flex flex-1 flex-col items-center gap-1">
        {areas.map((area, i) => {
          const prev = areas[i - 1];
          const showDivider = prev && prev.group !== area.group;
          const active = area.id === activeId;
          const hasFlyout = area.children.length > 0;
          return (
            <li
              key={area.id}
              className="flex flex-col items-center"
              onMouseEnter={() => onHoverArea(area.id)}
            >
              {showDivider ? (
                <span
                  aria-hidden="true"
                  className="mx-auto mb-1 mt-1 h-px w-8 bg-sidebar-border"
                />
              ) : null}
              <Link
                href={area.defaultRoute}
                data-module={area.accent}
                aria-current={active ? "page" : undefined}
                aria-haspopup={hasFlyout ? "true" : undefined}
                aria-expanded={
                  hasFlyout ? hoveredAreaId === area.id : undefined
                }
                className={cn(
                  "relative flex w-16 flex-col items-center gap-1 rounded-2xl px-1.5 py-2.5 text-center transition-all duration-200",
                  active
                    ? "glass-module text-module-line"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <span className="relative grid place-items-center">
                  <area.icon aria-hidden="true" className="size-5" />
                </span>
                <span className="text-[9px] font-medium leading-tight tracking-wide">
                  {area.shortLabel ?? area.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col items-center gap-2 border-t border-sidebar-border pt-4">
        <UserMenu />
        <RoleSwitcher compact />
        <ThemeToggle iconOnly />
      </div>
    </nav>
  );
}
