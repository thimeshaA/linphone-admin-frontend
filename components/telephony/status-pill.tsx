import {
  CircleCheck,
  CircleMinus,
  CircleSlash,
  Clock3,
  FileText,
} from "lucide-react";
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

/**
 * At-a-glance wallet status for a reseller — reuses the same
 * positive/negative tokens as `StatusPill` (green for healthy, muted
 * black/white for needs-attention — this palette has no red) rather than
 * inventing a new color for money.
 */
export function WalletStatusPill({
  owedAccounts,
  className,
}: {
  owedAccounts: number;
  className?: string;
}) {
  const owed = owedAccounts > 0;
  const Icon = owed ? CircleMinus : CircleCheck;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] leading-none tracking-wider uppercase transition-colors",
        owed
          ? "bg-negative-muted text-negative-foreground"
          : "bg-positive-muted text-positive-foreground",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {owed ? `${owedAccounts} owed` : "Paid up"}
    </span>
  );
}

/**
 * Invoices only ever have one bit of state: sent or not. No draft/paid
 * distinction exists on the backend — reuses `StatusPill`'s green-for-done,
 * neutral-pill-for-not-yet vocabulary rather than inventing a new one.
 */
export function InvoiceSentPill({
  sentAt,
  className,
}: {
  sentAt: string | null;
  className?: string;
}) {
  const sent = !!sentAt;
  const Icon = sent ? CircleCheck : FileText;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] leading-none tracking-wider uppercase transition-colors",
        sent
          ? "bg-positive-muted text-positive-foreground"
          : "bg-neutral-pill text-muted-foreground",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {sent ? "Sent" : "Not sent"}
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
