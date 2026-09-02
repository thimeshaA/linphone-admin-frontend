"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type AriaAttributes,
  type ComponentType,
} from "react";
import { cn } from "@/lib/utils";
import type { Accent } from "@/lib/telephony/nav-config";

export type LensTab = {
  id: string;
  label: string;
  icon: ComponentType<{
    "aria-hidden"?: AriaAttributes["aria-hidden"];
    className?: string;
  }>;
  /** Section colour for the under-lens tint + resting capsule fill. Omit for a neutral tab (e.g. "More"). */
  accent?: Accent;
};

// Icon-only, compact (Instagram-density) capsule: a 56x56 circle comfortably
// clears a 24px glyph scaled 1.4x (33.6px, ~24px half-diagonal) inside a
// 28px radius, with room to spare for the 1.06 drag-scale emphasis on top.
const LENS_WIDTH = 56;
const LENS_HEIGHT = 56;
const LENS_HALF_WIDTH = LENS_WIDTH / 2;
const BAR_HEIGHT = 60;
// The lens wrapper is vertically centred on the bar; the row inside it needs
// the exact opposite offset so bar-space content lines back up inside the
// wrapper's frame.
const LENS_POS_TOP = (BAR_HEIGHT - LENS_HEIGHT) / 2;
const LENS_ROW_TOP = -LENS_POS_TOP;

const ENTER_MS = 220;
const SPRING_MS = 380;
const SPRING_EASE = "cubic-bezier(.34,1.56,.64,1)";

const LENS_SCALE = 1.4;
const LENS_SCALE_REDUCED = 1.1;

function clamp(x: number, min: number, max: number) {
  return Math.min(Math.max(x, min), max);
}

function nearestIndex(centers: number[], x: number) {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < centers.length; i++) {
    const d = Math.abs((centers[i] ?? 0) - x);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

export function LensTabBar({
  tabs,
  activeIndex,
  onActivate,
  className,
}: {
  tabs: LensTab[];
  activeIndex: number;
  onActivate: (index: number) => void;
  className?: string;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const lensPosRef = useRef<HTMLDivElement>(null);
  const lensVisualRef = useRef<HTMLDivElement>(null);
  const lensRowRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lensTabRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const [restingIndex, setRestingIndex] = useState(activeIndex);
  const [dragging, setDragging] = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const [centers, setCenters] = useState<number[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);

  const centersRef = useRef<number[]>([]);
  const pendingXRef = useRef(0);
  const restingIndexRef = useRef(activeIndex);
  const draggingRef = useRef(false);
  const magnetIndexRef = useRef(-1);
  const enteringRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const enterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Syncs the internal "resting" override back to the controlled prop —
  // needed for external changes the gesture didn't cause (browser
  // back/forward, a deep link). This is the standard controlled-with-
  // local-override shape; the lint rule's preferred alternative (comparing
  // against a ref during render) is itself disallowed by this project's
  // stricter ref-during-render rule, so there's no variant of this sync
  // that satisfies both — effect-based sync is the least-bad option.
  useEffect(() => {
    restingIndexRef.current = activeIndex;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRestingIndex(activeIndex);
  }, [activeIndex]);

  const lensScaleRef = useRef(LENS_SCALE);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(mq.matches);
      lensScaleRef.current = mq.matches ? LENS_SCALE_REDUCED : LENS_SCALE;
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const measure = useCallback(() => {
    const bar = barRef.current;
    if (!bar) return;
    const barRect = bar.getBoundingClientRect();
    setBarWidth(barRect.width);
    const next = tabButtonRefs.current.map((el) => {
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      return r.left - barRect.left + r.width / 2;
    });
    // The ref is what the gesture/rAF hot path reads (needs to be current
    // synchronously, before React re-renders); the state copy is only for
    // the handful of render-time reads below (e.g. the resting capsule's
    // `left`), which aren't allowed to read a ref directly during render.
    centersRef.current = next;
    setCenters(next);
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (barRef.current) ro.observe(barRef.current);
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, [measure, tabs.length]);

  // The base row's tab currently under the lens goes opacity:0 (120ms) so
  // it never double-prints against the magnified copy — plain opacity, no
  // mask, no reflow, restored the instant a different tab becomes nearest
  // (or the drag ends, see releaseTo/endDrag).
  const setMagnet = useCallback((index: number) => {
    if (magnetIndexRef.current === index) return;
    const prevLens = lensTabRefs.current[magnetIndexRef.current];
    if (prevLens) prevLens.removeAttribute("data-lens-magnet");
    const prevBase = tabButtonRefs.current[magnetIndexRef.current];
    if (prevBase) prevBase.style.opacity = "";

    const nextLens = lensTabRefs.current[index];
    if (nextLens) nextLens.setAttribute("data-lens-magnet", "true");
    const nextBase = tabButtonRefs.current[index];
    if (nextBase) nextBase.style.opacity = "0";

    if (magnetIndexRef.current !== -1) navigator.vibrate?.(8);
    magnetIndexRef.current = index;
  }, []);

  /** Writes one frame of lens geometry straight to the DOM via refs — no
   * React state, so this can run every pointermove/rAF tick without
   * re-rendering the tree. */
  const writeFrame = useCallback(
    (rawX: number) => {
      const centers = centersRef.current;
      if (centers.length === 0) return;
      const min = centers[0] ?? 0;
      const max = centers[centers.length - 1] ?? 0;
      const x = clamp(rawX, min, max);

      const pos = lensPosRef.current;
      const row = lensRowRef.current;
      // The window (pos) and its content (row) must move in lockstep, or
      // the entrance ease makes the clip visibly drift out of register
      // with what's supposed to be centred under it — same duration/easing
      // on both, cleared to "none" the instant free 1:1 tracking begins.
      const ease = "cubic-bezier(.22,.61,.36,1)";
      if (pos) {
        pos.style.transition = enteringRef.current
          ? `transform ${ENTER_MS}ms ${ease}`
          : "none";
        pos.style.transform = `translate3d(${x - LENS_HALF_WIDTH}px, 0, 0)`;
      }
      if (row) {
        row.style.transition = enteringRef.current
          ? `left ${ENTER_MS}ms ${ease}, transform-origin ${ENTER_MS}ms ${ease}`
          : "none";
        row.style.left = `${-(x - LENS_HALF_WIDTH)}px`;
        row.style.transformOrigin = `${x}px ${BAR_HEIGHT / 2}px`;
        row.style.transform = `scale(${lensScaleRef.current})`;
      }
      setMagnet(nearestIndex(centers, x));
      return x;
    },
    [setMagnet],
  );

  // A self-scheduling rAF loop can't call itself by its own `const` name
  // (that name isn't bound yet inside its own initializer) without either a
  // stale closure or an eslint/compiler complaint about referencing a
  // variable before its declaration finishes — routing the recursive call
  // through a ref sidesteps both. The ref is kept current via an effect
  // (not a render-time assignment), which is where mutating a ref is safe.
  const tickRef = useRef<() => void>(() => {});
  const tick = useCallback(() => {
    if (!draggingRef.current) return;
    writeFrame(pendingXRef.current);
    rafRef.current = requestAnimationFrame(() => tickRef.current());
  }, [writeFrame]);
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);
  const startTicking = useCallback(() => {
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => tickRef.current());
    }
  }, []);

  // Guarantees every base-row tab is back at opacity 1 — belt-and-braces
  // alongside setMagnet's own restore, so a drag that ends between two rAF
  // ticks can never leave a tab stuck invisible.
  const restoreBaseOpacity = useCallback(() => {
    const buttons = tabButtonRefs.current;
    for (let i = 0; i < buttons.length; i++) {
      const el = buttons[i];
      if (el) el.style.opacity = "";
    }
  }, []);

  const releaseTo = useCallback(
    (index: number) => {
      const pos = lensPosRef.current;
      const row = lensRowRef.current;
      const visual = lensVisualRef.current;
      const centers = centersRef.current;
      const x = centers[index] ?? 0;
      if (pos) {
        pos.style.transition = reducedMotion
          ? "none"
          : `transform ${SPRING_MS}ms ${SPRING_EASE}`;
        pos.style.transform = `translate3d(${x - LENS_HALF_WIDTH}px, 0, 0)`;
      }
      if (row) {
        row.style.transition = reducedMotion
          ? "none"
          : `transform ${SPRING_MS - 60}ms ${SPRING_EASE}`;
        row.style.left = `${-(x - LENS_HALF_WIDTH)}px`;
        row.style.transformOrigin = `${x}px ${BAR_HEIGHT / 2}px`;
        row.style.transform = "scale(1)";
      }
      if (visual) {
        visual.removeAttribute("data-entering");
        visual.removeAttribute("data-dragging");
      }
      restoreBaseOpacity();
      const prevMagnet = lensTabRefs.current[magnetIndexRef.current];
      if (prevMagnet) prevMagnet.removeAttribute("data-lens-magnet");
      magnetIndexRef.current = -1;
    },
    [reducedMotion, restoreBaseOpacity],
  );

  const endDrag = useCallback(
    (commit: boolean) => {
      draggingRef.current = false;
      setDragging(false);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (enterTimeoutRef.current) {
        clearTimeout(enterTimeoutRef.current);
        enterTimeoutRef.current = null;
      }
      enteringRef.current = false;
      const centers = centersRef.current;
      const finalIndex = commit
        ? nearestIndex(centers, pendingXRef.current)
        : restingIndexRef.current;
      releaseTo(finalIndex);
      if (commit) {
        restingIndexRef.current = finalIndex;
        setRestingIndex(finalIndex);
        onActivate(finalIndex);
      }
    },
    [onActivate, releaseTo],
  );

  const beginDrag = useCallback(
    (clientX: number) => {
      const bar = barRef.current;
      if (!bar) return;
      measure();
      const barRect = bar.getBoundingClientRect();
      const x = clientX - barRect.left;
      draggingRef.current = true;
      setDragging(true);
      enteringRef.current = !reducedMotion;
      pendingXRef.current = x;

      const visual = lensVisualRef.current;
      if (visual) {
        if (!reducedMotion) visual.setAttribute("data-entering", "true");
        // force layout before flipping to dragging so the entrance
        // transition (opacity/scale) actually plays instead of being
        // coalesced with the attribute set below.
        void visual.offsetWidth;
        visual.setAttribute("data-dragging", "true");
      }
      writeFrame(x);
      startTicking();

      if (!reducedMotion) {
        if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
        enterTimeoutRef.current = setTimeout(() => {
          enteringRef.current = false;
          if (visual) visual.removeAttribute("data-entering");
        }, ENTER_MS);
      }
    },
    [measure, reducedMotion, startTicking, writeFrame],
  );

  // Pointer gestures are handled once, on the bar, and always own the
  // commit — the tab buttons underneath still need to be real, clickable
  // buttons for keyboard access, so every pointer-driven commit swallows
  // the native click that follows it (browsers fire click after pointerup
  // for the same interaction, so setting this synchronously in pointerup
  // is always in time).
  const suppressClickRef = useRef(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      suppressClickRef.current = false;
      pointerIdRef.current = e.pointerId;
      barRef.current?.setPointerCapture(e.pointerId);
      beginDrag(e.clientX);
    },
    [beginDrag],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId || !draggingRef.current) return;
    const barRect = barRef.current?.getBoundingClientRect();
    if (!barRect) return;
    const x = e.clientX - barRect.left;
    pendingXRef.current = x;
  }, []);

  // Pointer capture on the bar can redirect the trailing synthetic click to
  // the bar itself instead of the tab button underneath, so the click that's
  // supposed to consume/reset the flag never actually reaches onTabClick.
  // Clearing it on a same-tick timeout guarantees it never lingers into an
  // unrelated later interaction (e.g. a keyboard Enter minutes later) —
  // whichever happens first, the real click or this timeout, wins.
  const armSuppressClick = useCallback(() => {
    suppressClickRef.current = true;
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;
      pointerIdRef.current = null;
      armSuppressClick();
      endDrag(true);
    },
    [armSuppressClick, endDrag],
  );

  const onPointerCancelOrLeave = useCallback(
    (e: React.PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;
      pointerIdRef.current = null;
      armSuppressClick();
      endDrag(false);
    },
    [armSuppressClick, endDrag],
  );

  // Keyboard: roving focus between tabs previews the lens at the newly
  // focused tab, Enter/Space activates via the tab button's native click.
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTabFocus = useCallback(
    (index: number) => {
      measure();
      const centers = centersRef.current;
      if (centers.length === 0) return;
      draggingRef.current = true;
      setDragging(true);
      enteringRef.current = !reducedMotion;
      const visual = lensVisualRef.current;
      if (visual) {
        if (!reducedMotion) visual.setAttribute("data-entering", "true");
        void visual.offsetWidth;
        visual.setAttribute("data-dragging", "true");
      }
      const targetX = centers[index] ?? 0;
      writeFrame(targetX);
      pendingXRef.current = targetX;

      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = setTimeout(() => {
        draggingRef.current = false;
        setDragging(false);
        releaseTo(restingIndexRef.current);
      }, 700);
    },
    [measure, reducedMotion, releaseTo, writeFrame],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const next = clamp(index + dir, 0, tabs.length - 1);
        tabButtonRefs.current[next]?.focus();
      }
    },
    [tabs.length],
  );

  const onTabClick = useCallback(
    (index: number) => {
      // A pointer-driven commit already fired on pointerup (see
      // suppressClickRef above); this click is only live for keyboard
      // Enter/Space activation, which never goes through pointerup.
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      restingIndexRef.current = index;
      setRestingIndex(index);
      onActivate(index);
    },
    [onActivate],
  );

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    };
  }, []);

  const gridStyle = {
    gridTemplateColumns: `repeat(${tabs.length}, minmax(44px, 1fr))`,
  };
  const capsuleLeft = centers[restingIndex] ?? 0;
  const activeTab = tabs[restingIndex];

  return (
    <div
      ref={barRef}
      className={cn("lens-tabbar-root", className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancelOrLeave}
    >
      <div className="lens-tabbar-glass">
        {/* Pure background shape, no content of its own — the real icon/
            label live once, in the row below, which paints on top of this
            (DOM order, not z-index) so nothing is ever duplicated. Kept as
            a sibling (not a parent) of the row: the row must be an in-flow
            child of the root for the root's fit-content width to size
            around it — nesting it inside this absolutely-positioned glass
            layer would take it out of flow and collapse the root to 0. */}
        <div
          className="lens-tabbar-capsule"
          aria-hidden="true"
          data-neutral={activeTab?.accent ? undefined : "true"}
          data-hidden={dragging ? "true" : undefined}
          data-module={activeTab?.accent}
          style={{ left: capsuleLeft }}
        />
      </div>

      <div className="lens-tabbar-row" style={gridStyle}>
        <ul role="tablist" aria-label="Primary" className="contents">
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            const isRestingActive = restingIndex === i && !dragging;
            return (
              <li key={tab.id} role="presentation" className="contents">
                <button
                  ref={(el) => {
                    tabButtonRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={restingIndex === i}
                  aria-label={tab.label}
                  tabIndex={restingIndex === i ? 0 : -1}
                  data-module={tab.accent}
                  data-neutral={tab.accent ? undefined : "true"}
                  data-active-rest={isRestingActive ? "true" : undefined}
                  className="lens-tab"
                  onFocus={() => onTabFocus(i)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  onClick={() => onTabClick(i)}
                >
                  <Icon aria-hidden="true" className="size-6 shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div
        ref={lensPosRef}
        className="lens-tabbar-lens-pos"
        style={{ width: LENS_WIDTH, height: LENS_HEIGHT, top: LENS_POS_TOP }}
      >
        <div ref={lensVisualRef} className="lens-tabbar-lens-visual">
          <div className="lens-tabbar-clip">
            <div
              ref={lensRowRef}
              className="lens-tabbar-lens-row"
              style={{
                ...gridStyle,
                width: barWidth,
                height: BAR_HEIGHT,
                top: LENS_ROW_TOP,
              }}
              aria-hidden="true"
            >
              {tabs.map((tab, i) => {
                const Icon = tab.icon;
                return (
                  <span
                    key={tab.id}
                    ref={(el) => {
                      lensTabRefs.current[i] = el;
                    }}
                    data-module={tab.accent}
                    data-neutral={tab.accent ? undefined : "true"}
                    className="lens-tab"
                  >
                    <Icon aria-hidden="true" className="size-6 shrink-0" />
                  </span>
                );
              })}
            </div>
          </div>
          <div className="lens-tabbar-ring" />
        </div>
      </div>
    </div>
  );
}
