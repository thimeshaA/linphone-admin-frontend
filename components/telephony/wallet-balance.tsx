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
    <div className="@container flex min-w-0 flex-col gap-2">
      <span className="label-meta">{label}</span>
      {loading ? (
        <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
      ) : (
        // Sized off this stat's own column width (cqi), not the viewport: a
        // formatted amount ("$86,419.69") is far wider than StatBlock's
        // counts, and the grids it sits in range from two narrow phone
        // columns to three beside the desktop sidebars — any fixed
        // breakpoint size overran one of them. overflow-wrap is the last
        // resort for seven-figure balances at the 1.5rem floor.
        <span
          className={cn(
            "stat-figure text-[length:clamp(1.5rem,12cqi,3rem)] tabular-nums transition-colors [overflow-wrap:anywhere]",
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
