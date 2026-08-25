"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_AREAS, type SecondaryItem } from "@/lib/telephony/nav-config";
import { useTelephony } from "@/contexts/telephony-context";
import { cn } from "@/lib/utils";

/** Role-filters leaf links, then drops any section header left with no
 * visible children under it — e.g. "Reseller Management" for a reseller,
 * once every link beneath it is admin-only. */
function visibleSecondaryItems(
  items: SecondaryItem[],
  isAdmin: boolean,
): SecondaryItem[] {
  const visible: SecondaryItem[] = [];
  let pendingSection: SecondaryItem | null = null;
  for (const item of items) {
    if (item.kind === "section") {
      pendingSection = item;
      continue;
    }
    if (item.adminOnly && !isAdmin) continue;
    if (pendingSection) {
      visible.push(pendingSection);
      pendingSection = null;
    }
    visible.push(item);
  }
  return visible;
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
  const children = visibleSecondaryItems(area.children, isAdmin);

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
              aria-current={item.route === pathname ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                item.route === pathname
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
