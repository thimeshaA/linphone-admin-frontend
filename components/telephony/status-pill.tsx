import { CircleCheck, CircleMinus, CircleSlash, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL } from "@/lib/telephony/status";
import type { AccountStatus, ModuleKey } from "@/lib/telephony/types";

/*
 * Palette rules:
 *  active   -> neon green (healthy / positive)
 *  expiring -> active module identity (orange for SIP)
 *  disabled / expired -> no red in the palette, so meaning comes from the icon
 *  and label with a reduced-opacity white/black treatment.
 */
const TONE: Record<AccountStatus, string> = {
  active: "bg-positive-muted text-positive-foreground",
  expiring: "module-tint",
  disabled: "bg-negative-muted text-negative-foreground",
  expired: "bg-negative-muted text-negative-foreground",
};

const ICON: Record<AccountStatus, typeof CircleCheck> = {
  active: CircleCheck,
  expiring: Clock3,
  disabled: CircleMinus,
  expired: CircleSlash,
};

export function StatusPill({
  status,
  className,
}: {
  status: AccountStatus;
  className?: string;
}) {
  const Icon = ICON[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] leading-none tracking-wider uppercase transition-colors",
        TONE[status],
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function MetaTag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-neutral-pill px-2.5 py-1 font-mono text-[11px] leading-none tracking-wider uppercase text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ModuleTag({
  module,
  className,
}: {
  module: ModuleKey;
  className?: string;
}) {
  return (
    <span
      data-module={module}
      className={cn(
        "module-tint inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] leading-none tracking-wider uppercase",
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-module" />
      {module.toUpperCase()}
    </span>
  );
}
