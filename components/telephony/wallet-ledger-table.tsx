import { Download } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { invoicesApi } from "@/lib/api/invoices";
import { formatDate } from "@/lib/telephony/status";
import type {
  SipAccount,
  WalletLedgerEntry,
  WalletLedgerType,
} from "@/lib/telephony/types";
import { cn, downloadBlob } from "@/lib/utils";
import { EmptyState } from "./primitives";
import { formatUsd } from "./wallet-balance";

const TYPE_LABEL: Record<WalletLedgerType, string> = {
  initial_credit: "Initial credit",
  admin_topup: "Top-up",
  renewal_deduction: "Renewal deduction",
  payment_received: "Payment",
};

function accountLabel(entry: WalletLedgerEntry, accounts: SipAccount[]) {
  if (!entry.relatedAccountId) return "—";
  const account = accounts.find((a) => a.id === entry.relatedAccountId);
  // Only reachable once the real account list has loaded (the table is kept
  // in its loading state until then) — an entry can still land here if the
  // account was later hard-deleted, since the backend keeps no record of it.
  return account ? account.sipId : "Deleted account";
}

function referenceLabel(entry: WalletLedgerEntry) {
  if (entry.invoiceId) return `Invoice #${entry.invoiceId}`;
  return "—";
}

async function downloadInvoiceReceipt(invoiceId: string) {
  try {
    const { blob, filename } = await invoicesApi.pdf(invoiceId);
    downloadBlob(blob, filename ?? `invoice-${invoiceId}.pdf`);
  } catch (err) {
    toast.error("Could not download the receipt", {
      description:
        err instanceof ApiError
          ? err.message
          : "The backend rejected the request.",
    });
  }
}

function ReceiptButton({ invoiceId }: { invoiceId: string }) {
  return (
    <button
      type="button"
      onClick={() => downloadInvoiceReceipt(invoiceId)}
      className="glass inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium hover:bg-accent"
      title={`Download receipt for invoice #${invoiceId}`}
    >
      <Download aria-hidden="true" className="size-3.5" />
      Invoice #{invoiceId}
    </button>
  );
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
        <table className="w-full min-w-[760px] text-sm">
          <caption className="sr-only">Wallet ledger history</caption>
          <thead>
            <tr className="border-b border-border">
              {["Date", "Type", "Amount", "Account", "Reference"].map((h) => (
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
                  {accountLabel(e, accounts)}
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {e.invoiceId ? (
                    <ReceiptButton invoiceId={e.invoiceId} />
                  ) : (
                    referenceLabel(e)
                  )}
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
            {e.relatedAccountId ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {accountLabel(e, accounts)}
              </p>
            ) : null}
            {e.invoiceId ? (
              <div className="mt-2">
                <ReceiptButton invoiceId={e.invoiceId} />
              </div>
            ) : null}
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
