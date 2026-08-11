"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function CountUp({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = prev.current;
    prev.current = value;
    if (reduce || from === value) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const duration = 620;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className={cn("stat-figure tabular-nums", className)}>
      {display.toLocaleString()}
    </span>
  );
}

export function StatBlock({
  label,
  value,
  hint,
  tone = "default",
  loading,
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "default" | "accent" | "success" | "negative";
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="label-meta">{label}</span>
      {loading ? (
        <div className="h-10 w-20 animate-pulse rounded-md bg-muted" />
      ) : (
        <CountUp
          value={value}
          className={cn(
            "text-4xl transition-colors sm:text-5xl",
            tone === "accent" && "text-module",
            tone === "success" && "text-positive-foreground",
            tone === "negative" && "text-negative-foreground",
          )}
        />
      )}
      {hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  module,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  module?: "sip" | "esim";
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="label-meta flex items-center gap-2">
          {module ? (
            <>
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-module"
              />
              <span className="text-module">
                {module === "sip" ? "SIP" : "eSIM"}
              </span>
              <span aria-hidden="true" className="opacity-40">
                /
              </span>
            </>
          ) : null}
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon ? (
        <div className="mb-4 grid size-11 place-items-center rounded-full bg-neutral-pill text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <p className="font-display text-base font-semibold">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center px-6 py-14 text-center"
    >
      <p className="font-display text-base font-semibold text-negative-foreground">
        {title}
      </p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-full bg-secondary px-4 py-2 text-sm font-medium transition-transform active:scale-[0.97]"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function RowSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
