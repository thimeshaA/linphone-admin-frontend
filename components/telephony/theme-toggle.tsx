"use client";

import { Moon, Sun } from "lucide-react";
import { useTelephony } from "@/contexts/telephony-context";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  iconOnly,
}: {
  className?: string;
  iconOnly?: boolean;
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
        iconOnly ? "size-10 justify-center" : "h-10 px-3",
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
        <span className="font-mono text-[11px] tracking-wider uppercase">
          {isDark ? "Dark" : "Light"}
        </span>
      )}
    </button>
  );
}
