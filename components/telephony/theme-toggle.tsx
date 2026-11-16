"use client";

import { Moon, Sun } from "lucide-react";
import { useTelephony } from "@/contexts/telephony-context";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  iconOnly,
  iconOnlyOnPhone,
}: {
  className?: string;
  iconOnly?: boolean;
  /** Icon-only below md, labelled from md up. */
  iconOnlyOnPhone?: boolean;
}) {
  const { theme, toggleTheme } = useTelephony();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-secondary text-sm font-medium transition-colors hover:bg-accent",
        iconOnly
          ? "size-10 justify-center"
          : iconOnlyOnPhone
            ? "h-10 w-10 justify-center md:w-auto md:px-3"
            : "h-10 px-3",
        className,
      )}
    >
      <span className="relative grid size-5 place-items-center">
        <Sun
          aria-hidden="true"
          className={cn(
            "absolute size-4 transition-all duration-300",
            isDark ? "scale-50 opacity-0" : "scale-100 opacity-100",
          )}
        />
        <Moon
          aria-hidden="true"
          className={cn(
            "absolute size-4 transition-all duration-300",
            isDark ? "scale-100 opacity-100" : "scale-50 opacity-0",
          )}
        />
      </span>
      {iconOnly ? null : (
        <span
          className={cn(
            "font-mono text-[11px] tracking-wider uppercase",
            iconOnlyOnPhone && "max-md:hidden",
          )}
        >
          {isDark ? "Dark" : "Light"}
        </span>
      )}
    </button>
  );
}
