import { formatDate } from "@/lib/telephony/status";
import type {
  SipAccount,
  WalletLedgerEntry,
  WalletLedgerType,
} from "@/lib/telephony/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "./primitives";
import { formatUsd } from "./wallet-balance";

const TYPE_LABEL: Record<WalletLedgerType, string> = {
  initial_credit: "Initial credit",
  admin_topup: "Top-up",
  renewal_deduction: "Renewal deduction",
  payment_received: "Payment",
};

function relatedLabel(entry: WalletLedgerEntry, accounts: SipAccount[]) {
  if (entry.relatedAccountId) {
    const account = accounts.find((a) => a.id === entry.relatedAccountId);
    return account ? account.sipId : `Account #${entry.relatedAccountId}`;
  }
  if (entry.invoiceId) return `Invoice #${entry.invoiceId}`;
  return "—";
}

/** Shared ledger history table — reseller's own wallet page and the admin's
 * per-reseller wallet dialog both render the same rows. */
export function WalletLedgerTable({
  entries,
  accounts = [],
  loading,
  page,
  pageCount,
  onPageChange,
}: {
  entries: WalletLedgerEntry[];
  accounts?: SipAccount[] | undefined;
  loading?: boolean | undefined;
  page?: number | undefined;
  pageCount?: number | undefined;
  onPageChange?: ((page: number) => void) | undefined;
}) {
  if (loading) {
    return (
      <div className="glass rounded-[20px]">
        <EmptyState
          title="Loading ledger…"
          description="Fetching wallet history."
        />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="glass rounded-[20px]">
        <EmptyState
          title="No ledger entries yet"
          description="Top-ups, renewals and payments will show up here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop table */}
      <div className="glass hidden overflow-x-auto rounded-[20px] md:block">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="sr-only">Wallet ledger history</caption>
          <thead>
            <tr className="border-b border-border">
              {["Date", "Type", "Amount", "Related"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="label-meta px-5 py-3.5 text-left"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.id}
                className="border-b border-border last:border-0 hover:bg-accent/30"
              >
                <td className="px-5 py-4 tabular-nums text-muted-foreground">
                  {formatDate(e.createdAt)}
                </td>
                <td className="px-5 py-4">{TYPE_LABEL[e.type]}</td>
                <td
                  className={cn(
                    "px-5 py-4 tabular-nums font-medium",
                    e.amountUsd >= 0
                      ? "text-positive-foreground"
                      : "text-negative-foreground",
                  )}
                >
                  {e.amountUsd >= 0 ? "+" : ""}
                  {formatUsd(e.amountUsd)}
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {relatedLabel(e, accounts)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {entries.map((e) => (
          <li key={e.id} className="glass rounded-[20px] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{TYPE_LABEL[e.type]}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(e.createdAt)}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 tabular-nums text-sm font-semibold",
                  e.amountUsd >= 0
                    ? "text-positive-foreground"
                    : "text-negative-foreground",
                )}
              >
                {e.amountUsd >= 0 ? "+" : ""}
                {formatUsd(e.amountUsd)}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {relatedLabel(e, accounts)}
            </p>
          </li>
        ))}
      </ul>

      {page !== undefined &&
      pageCount !== undefined &&
      pageCount > 1 &&
      onPageChange ? (
        <div className="flex items-center justify-between gap-3">
          <p className="label-meta">
            Page {page} of {pageCount}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="glass h-10 rounded-xl px-4 text-sm font-medium disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
              className="glass h-10 rounded-xl px-4 text-sm font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
