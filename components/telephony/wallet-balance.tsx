import { cn } from "@/lib/utils";

export function formatUsd(amountUsd: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountUsd);
}

/**
 * Big wallet-balance figure, styled like `StatBlock` but currency-aware.
 * Color follows the same positive/negative tokens `StatusPill` uses — green
 * for a healthy balance, muted for a negative (owed) one — so balance and
 * status pills read as one consistent language rather than two.
 */
export function BalanceStat({
  label = "Wallet balance",
  balanceUsd,
  hint,
  loading,
  tone = "auto",
}: {
  label?: string;
  balanceUsd: number;
  hint?: string | undefined;
  loading?: boolean | undefined;
  /** "auto" colors by the sign of `balanceUsd` (the normal case). Override
   * for a stat like "Total owed" — always negative-tinted regardless of
   * whether the number is displayed as a positive magnitude. */
  tone?: "auto" | "positive" | "negative" | undefined;
}) {
  const positive = tone === "auto" ? balanceUsd >= 0 : tone === "positive";
  return (
    <div className="flex flex-col gap-2">
      <span className="label-meta">{label}</span>
      {loading ? (
        <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
      ) : (
        <span
          className={cn(
            "stat-figure text-4xl tabular-nums transition-colors sm:text-5xl",
            positive ? "text-positive-foreground" : "text-negative-foreground",
          )}
        >
          {formatUsd(balanceUsd)}
        </span>
      )}
      {hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  );
}
