"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_AREAS, type SecondaryItem } from "@/lib/telephony/nav-config";
import { useTelephony } from "@/contexts/telephony-context";
import { cn } from "@/lib/utils";

/** Role-filters leaf links. A section header is suppressed outright when
 * it's itself admin-only and the viewer isn't admin (e.g. "Reseller
 * Management" never appears for a reseller, even though one of its
 * children — their own Invoices — is visible to them too; that child just
 * renders unheaded, as a top-level item, instead of inheriting the header).
 * Also dropped if none of its children end up visible to this role at all.
 * Shared with the mobile secondary drawer so both surfaces stay in sync off
 * the same nav-config source. */
export function visibleSecondaryItems(
  items: SecondaryItem[],
  isAdmin: boolean,
  isReseller: boolean,
): SecondaryItem[] {
  const visible: SecondaryItem[] = [];
  let pendingSection: SecondaryItem | null = null;
  for (const item of items) {
    if (item.kind === "section") {
      pendingSection = item.adminOnly && !isAdmin ? null : item;
      continue;
    }
    if (item.adminOnly && !isAdmin) continue;
    if (item.resellerOnly && !isReseller) continue;
    if (pendingSection) {
      visible.push(pendingSection);
      pendingSection = null;
    }
    visible.push(item);
  }
  return visible;
}

/** Active for an exact match or any sub-page beneath it (e.g. the "Wallets"
 * link stays highlighted while drilled into a specific reseller's wallet
 * detail page) — same startsWith-a-prefix convention `activeAreaId` already
 * uses one level up, for the primary rail. */
export function isSecondaryItemActive(route: string, pathname: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

/**
 * The workspace's detail navigation. Occupies real space in the desktop
 * flex row — mounted only while a workspace icon (or this column itself)
 * is hovered, so the main content reflows around it instead of it
 * floating on top.
 */
export function SecondaryColumn({ areaId }: { areaId: string | null }) {
  const { user } = useTelephony();
  const pathname = usePathname();
  const area = PRIMARY_AREAS.find((a) => a.id === areaId);
  if (!area || area.children.length === 0) return null;

  const isAdmin = user?.role === "admin";
  const children = visibleSecondaryItems(
    area.children,
    isAdmin,
    user?.role === "reseller",
  );

  return (
    <aside
      data-module={area.accent}
      className="glass glass-hairline sticky top-0 flex h-dvh w-64 shrink-0 flex-col border-y-0 px-4 py-6"
    >
      <p className="label-meta flex items-center gap-2">
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-module transition-colors"
        />
        {area.label}
      </p>
      <nav
        aria-label={area.label}
        className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto"
      >
        {children.map((item, i) =>
          item.kind === "section" ? (
            <p key={`section-${i}`} className="label-meta mt-5 px-3 first:mt-0">
              {item.label}
            </p>
          ) : (
            <Link
              key={item.id}
              href={item.route}
              aria-current={
                isSecondaryItemActive(item.route, pathname) ? "page" : undefined
              }
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isSecondaryItemActive(item.route, pathname)
                  ? "glass-module text-module-line"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              {item.icon ? (
                <item.icon aria-hidden="true" className="size-4 shrink-0" />
              ) : null}
              <span className="truncate">{item.label}</span>
            </Link>
          ),
        )}
      </nav>
    </aside>
  );
}
