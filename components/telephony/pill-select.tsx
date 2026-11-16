"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PillSelectOption<T extends string> {
  value: T;
  label: string;
}

/**
 * The mono-uppercase pill sort/filter select used above list pages.
 *
 * md and up it's the plain native <select> it always was — the wrapper is
 * `display: contents`, so the select stays a direct flex child of whatever
 * row it sits in. Below md the select becomes a transparent layer over a
 * 13px label: iOS Safari zooms the page when a focused select's font-size is
 * under 16px (globals.css floors it at 16px for that reason), so the native
 * control keeps its 16px while what you actually see matches the cards. Tap
 * targets, the native picker and screen-reader behaviour are all still the
 * real select's.
 */
export function PillSelect<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
  className,
  selectClassName,
}: {
  id: string;
  /** Accessible name; visually hidden. */
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: PillSelectOption<T>[];
  /** Phone-only wrapper constraints, e.g. a max width for long names. */
  className?: string;
  /** Extra classes on the native select (its desktop look). */
  selectClassName?: string;
}) {
  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <div
      className={cn(
        "md:contents",
        "glass relative flex h-9 w-fit max-w-full min-w-0 items-center rounded-full ring-1 ring-input has-[select:focus-visible]:ring-2 has-[select:focus-visible]:ring-ring",
        className,
      )}
    >
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <span
        aria-hidden="true"
        className="pointer-events-none flex min-w-0 items-center gap-1.5 pl-3.5 pr-3 text-[13px] md:hidden"
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={cn(
          "glass h-9 rounded-full px-3 font-mono text-[11px] tracking-wider uppercase outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring",
          "max-md:absolute max-md:inset-0 max-md:w-full max-md:cursor-pointer max-md:appearance-none max-md:opacity-0",
          selectClassName,
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
