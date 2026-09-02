"use client";

import { useRouter, usePathname } from "next/navigation";
import { LogOut, MoreHorizontal } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useTelephony } from "@/contexts/telephony-context";
import { permissionsFor } from "@/lib/telephony/permissions";
import { cn } from "@/lib/utils";
import { activeAreaId, visibleAreas } from "./primary-rail";
import { LensTabBar, type LensTab } from "./lens-tab-bar";

const PRIMARY_IDS = ["overview", "sip"];

export function MobileBottomNav() {
  const { user, signOut } = useTelephony();
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const perms = permissionsFor(user);
  const areas = visibleAreas(perms);
  const areaId = activeAreaId(pathname) ?? "overview";
  const primaryAreas = areas.filter((a) => PRIMARY_IDS.includes(a.id));
  const moreAreas = areas.filter((a) => !PRIMARY_IDS.includes(a.id));
  const moreActive = moreAreas.some((a) => a.id === areaId);

  const tabs: LensTab[] = useMemo(
    () => [
      ...primaryAreas.map((a) => ({
        id: a.id,
        label: a.shortLabel ?? a.label,
        icon: a.icon,
        accent: a.accent,
      })),
      ...(moreAreas.length > 0
        ? [{ id: "more", label: "More", icon: MoreHorizontal }]
        : []),
    ],
    [primaryAreas, moreAreas],
  );

  // Reflects the sheet being open too, not just the current route — so
  // tapping "More" (which opens the sheet without navigating) shows its
  // capsule immediately, and dismissing without picking anything reverts
  // the capsule to wherever the route actually is.
  const activeIndex = useMemo(() => {
    if (moreOpen || moreActive) return tabs.length - 1;
    const i = primaryAreas.findIndex((a) => a.id === areaId);
    return i === -1 ? 0 : i;
  }, [primaryAreas, areaId, moreOpen, moreActive, tabs.length]);

  const onActivate = useCallback(
    (index: number) => {
      const tab = tabs[index];
      if (!tab) return;
      if (tab.id === "more") {
        setMoreOpen(true);
        return;
      }
      setMoreOpen(false);
      const area = primaryAreas.find((a) => a.id === tab.id);
      if (area) router.push(area.defaultRoute);
    },
    [tabs, primaryAreas, router],
  );

  return (
    <div className="md:hidden">
      <AnimatePresence>
        {moreOpen && moreAreas.length > 0 ? (
          <div key="more">
            <motion.button
              type="button"
              aria-label="Close menu"
              onClick={() => setMoreOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-30 bg-black/40"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong fixed inset-x-4 z-40 flex flex-col gap-1 rounded-[22px] p-2"
              style={{
                bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)",
              }}
            >
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
                        ? "glass-module text-module-line"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                    )}
                  >
                    <a.icon aria-hidden="true" className="size-4 shrink-0" />
                    {a.label}
                  </Link>
                );
              })}

              <div className="my-1 h-px bg-border" aria-hidden="true" />

              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  signOut();
                  router.push("/");
                }}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              >
                <LogOut aria-hidden="true" className="size-4 shrink-0" />
                Sign out
              </button>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <LensTabBar
        tabs={tabs}
        activeIndex={activeIndex}
        onActivate={onActivate}
      />
    </div>
  );
}
