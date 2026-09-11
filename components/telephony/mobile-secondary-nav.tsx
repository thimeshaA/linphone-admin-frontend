"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { PRIMARY_AREAS } from "@/lib/telephony/nav-config";
import { useTelephony } from "@/contexts/telephony-context";
import {
  isSecondaryItemActive,
  visibleSecondaryItems,
} from "./secondary-column";
import { cn } from "@/lib/utils";

/**
 * Mobile-only counterpart to `<SecondaryColumn>` — a hamburger trigger in
 * the mobile top bar plus a left-edge drawer, shown only while inside a
 * workspace that actually has children to navigate (SIP today). Reuses
 * `PRIMARY_AREAS` and the same `visibleSecondaryItems` role filter desktop
 * uses, so the item set (and admin-only pruning) never drifts from desktop.
 *
 * Slides in from the left, mirroring where the desktop secondary column
 * physically sits (against the primary rail on the left edge) — a right
 * drawer would put it opposite where this nav "lives" spatially. The
 * open/close interaction (backdrop button + AnimatePresence) matches the
 * bottom nav's "More" sheet for a consistent feel across the two mobile
 * nav surfaces; this one has a floating close button since it appears
 * over the mobile top bar rather than beside it.
 *
 * The overlay portion is portalled to `document.body` rather than rendered
 * inline: the trigger lives inside the mobile top bar's `.glass` container,
 * and `backdrop-filter` (which `.glass` uses) creates a new containing
 * block for `position: fixed` descendants — without the portal, the
 * backdrop and drawer would size themselves against the top bar's own box
 * instead of the viewport.
 */
export function MobileSecondaryNav({ areaId }: { areaId: string | null }) {
  const { user } = useTelephony();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const area = PRIMARY_AREAS.find((a) => a.id === areaId);
  if (!area || area.children.length === 0) return null;

  const isAdmin = user?.role === "admin";
  const items = visibleSecondaryItems(
    area.children,
    isAdmin,
    user?.role === "reseller",
  );

  return (
    <>
      <button
        type="button"
        aria-label={`Open ${area.label} navigation`}
        onClick={() => setOpen(true)}
        className="grid size-10 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-sidebar-accent"
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>

      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <div key="mobile-secondary-nav" data-module={area.accent}>
                  <motion.button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-50 bg-black/40"
                  />
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="glass-strong fixed top-0 left-0 z-50 flex h-dvh w-[82vw] max-w-xs flex-col gap-1 overflow-y-auto p-4"
                    style={{
                      paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)",
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between px-1">
                      <p className="label-meta flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="size-1.5 rounded-full bg-module"
                        />
                        {area.label}
                      </p>
                      <button
                        type="button"
                        aria-label="Close navigation"
                        onClick={() => setOpen(false)}
                        className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary"
                      >
                        <X aria-hidden="true" className="size-4" />
                      </button>
                    </div>

                    <nav
                      aria-label={area.label}
                      className="flex flex-col gap-1"
                    >
                      {items.map((item, i) =>
                        item.kind === "section" ? (
                          <p
                            key={`section-${i}`}
                            className="label-meta mt-5 px-3 first:mt-0"
                          >
                            {item.label}
                          </p>
                        ) : (
                          <Link
                            key={item.id}
                            href={item.route}
                            onClick={() => setOpen(false)}
                            aria-current={
                              isSecondaryItemActive(item.route, pathname)
                                ? "page"
                                : undefined
                            }
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                              isSecondaryItemActive(item.route, pathname)
                                ? "glass-module text-module-line"
                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                            )}
                          >
                            {item.icon ? (
                              <item.icon
                                aria-hidden="true"
                                className="size-4 shrink-0"
                              />
                            ) : null}
                            <span className="truncate">{item.label}</span>
                          </Link>
                        ),
                      )}
                    </nav>
                  </motion.div>
                </div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
