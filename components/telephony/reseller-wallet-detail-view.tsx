"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Plus, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader, StatBlock } from "./primitives";
import { InvoiceSentPill } from "./status-pill";
import { InvoiceGenerator, SendInvoiceDialog } from "./invoice-dialogs";
import { TopUpWalletDialog } from "./top-up-dialog";
import { BalanceStat, formatUsd } from "./wallet-balance";
import { WalletLedgerTable } from "./wallet-ledger-table";
import {
  formatPeriodValue,
  lastDayOfPeriodValue,
  periodHasEnded,
} from "./period-select";
import { useTelephony } from "@/contexts/telephony-context";
import { ApiError } from "@/lib/api/client";
import { walletApi } from "@/lib/api/wallet";
import { invoicesApi } from "@/lib/api/invoices";
import { downloadBlob } from "@/lib/utils";
import { formatDate } from "@/lib/telephony/status";
import type { Invoice, Wallet } from "@/lib/telephony/types";

const LEDGER_PAGE_SIZE = 10;

/**
 * Admin-only per-reseller wallet detail — the consolidated home for every
 * wallet + invoice action on one reseller: balance/ledger/top-up (Phase 6)
 * and the full generate -> preview -> send invoice flow (Phase 8), plus
 * that reseller's own recent invoices, all on one page instead of a modal
 * plus a separate global list. Reached from a row on `ResellerWalletsView`
 * or the Resellers list's "View wallet" action.
 */
export function ResellerWalletDetailView({
  resellerId,
}: {
  resellerId: string;
}) {
  const { user, resellers, resellersLoading, accounts } = useTelephony();
  const isAdmin = user?.role === "admin";
  const reseller = resellers.find((r) => r.id === resellerId);

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");
  // A 404 here means this reseller predates the wallet feature and none was
  // ever provisioned for them — a real, displayable state, not a failure.
  const [walletNotFound, setWalletNotFound] = useState(false);
  const [page, setPage] = useState(1);
  const [walletRefreshKey, setWalletRefreshKey] = useState(0);
  const [toppingUp, setToppingUp] = useState(false);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState("");
  const [invoicesRefreshKey, setInvoicesRefreshKey] = useState(0);
  const [sendingInvoice, setSendingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setWalletLoading(true);
    setWalletError("");
    setWalletNotFound(false);
    walletApi
      .get(resellerId, { page, limit: LEDGER_PAGE_SIZE })
      .then((w) => {
        if (!cancelled) setWallet(w);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setWalletNotFound(true);
          return;
        }
        setWalletError(
          err instanceof ApiError ? err.message : "Could not load the wallet.",
        );
      })
      .finally(() => {
        if (!cancelled) setWalletLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, resellerId, page, walletRefreshKey]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setInvoicesLoading(true);
    setInvoicesError("");
    invoicesApi
      .list({ resellerId })
      .then((rows) => {
        if (!cancelled) setInvoices(rows);
      })
      .catch((err) => {
        if (cancelled) return;
        setInvoicesError(
          err instanceof ApiError ? err.message : "Could not load invoices.",
        );
      })
      .finally(() => {
        if (!cancelled) setInvoicesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, resellerId, invoicesRefreshKey]);

  if (!isAdmin) {
    return (
      <EmptyState
        title="Administrators only"
        description="Wallet management is restricted to platform administrators."
      />
    );
  }

  if (!reseller) {
    if (resellersLoading) {
      return (
        <EmptyState
          title="Loading reseller…"
          description="Fetching the current reseller list."
        />
      );
    }
    return (
      <EmptyState
        icon={<WalletIcon aria-hidden="true" className="size-5" />}
        title="Reseller not found"
        description="This reseller doesn't exist, or you don't have access to it."
        action={
          <Link
            href="/sip/reseller-wallets"
            className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium"
          >
            Back to Wallets
          </Link>
        }
      />
    );
  }

  async function handleDownloadInvoicePdf(invoice: Invoice) {
    try {
      const { blob, filename } = await invoicesApi.pdf(invoice.id);
      downloadBlob(blob, filename ?? `invoice-${invoice.periodValue}.pdf`);
    } catch (err) {
      toast.error("Could not download the PDF", {
        description:
          err instanceof ApiError
            ? err.message
            : "The backend rejected the request.",
      });
    }
  }

  function applyInvoiceUpdate(updated: Invoice) {
    setInvoices((prev) =>
      prev.some((i) => i.id === updated.id)
        ? prev.map((i) => (i.id === updated.id ? updated : i))
        : [updated, ...prev],
    );
  }

  const pageCount = wallet
    ? Math.max(1, Math.ceil(wallet.pagination.total / wallet.pagination.limit))
    : 1;

  return (
    <div className="space-y-10">
      <PageHeader
        module="sip"
        eyebrow="Reseller management"
        title={reseller.username}
        description="Wallet balance, ledger history, and invoices for this reseller."
        actions={
          <>
            <Link
              href="/sip/reseller-wallets"
              className="glass inline-flex h-11 items-center rounded-xl px-4 text-sm font-medium hover:bg-accent"
            >
              Back to Wallets
            </Link>
            {!walletNotFound ? (
              <button
                type="button"
                onClick={() => setToppingUp(true)}
                className="module-bg inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-transform active:scale-[0.98]"
              >
                <Plus aria-hidden="true" className="size-4" />
                Top up
              </button>
            ) : null}
          </>
        }
      />

      {walletError ? (
        <p
          role="alert"
          className="rounded-xl bg-negative-muted px-4 py-3 text-sm text-negative-foreground"
        >
          {walletError}
        </p>
      ) : walletNotFound ? (
        <div className="glass rounded-[20px]">
          <EmptyState
            icon={<WalletIcon aria-hidden="true" className="size-5" />}
            title="No wallet on record"
            description="This reseller predates the wallet feature, so none was ever provisioned for them. There's currently no way to add one after the fact from here."
          />
        </div>
      ) : (
        <>
          <section
            aria-label="Overview"
            className="grid grid-cols-2 gap-6 lg:grid-cols-4"
          >
            <BalanceStat
              balanceUsd={wallet?.balanceUsd ?? 0}
              loading={walletLoading && !wallet}
            />
            <StatBlock
              label="Owed accounts"
              value={wallet?.owedAccounts ?? 0}
              tone={wallet && wallet.owedAccounts > 0 ? "negative" : "default"}
              hint="Renewal cycles the deficit represents"
              loading={walletLoading && !wallet}
            />
          </section>

          <section aria-label="Ledger history" className="space-y-4">
            <h2 className="font-display text-lg font-bold tracking-tight">
              Ledger history
            </h2>
            <WalletLedgerTable
              entries={wallet?.ledger ?? []}
              accounts={accounts}
              loading={walletLoading && !wallet}
              page={wallet?.pagination.page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </section>

          <div className="grid items-start gap-6 lg:grid-cols-[23rem_minmax(0,1fr)]">
            <section aria-label="Generate invoice">
              <InvoiceGenerator
                reseller={reseller}
                onGenerated={() => {
                  setPage(1);
                  setWalletRefreshKey((k) => k + 1);
                  setInvoicesRefreshKey((k) => k + 1);
                }}
              />
            </section>

            <section aria-label="Recent invoices" className="space-y-4">
              <h2 className="font-display text-lg font-bold tracking-tight">
                Recent invoices
              </h2>
              {invoicesError ? (
                <p
                  role="alert"
                  className="rounded-xl bg-negative-muted px-4 py-3 text-sm text-negative-foreground"
                >
                  {invoicesError}
                </p>
              ) : invoicesLoading && invoices.length === 0 ? (
                <div className="glass rounded-[20px]">
                  <EmptyState
                    title="Loading invoices…"
                    description="Fetching invoice history for this reseller."
                  />
                </div>
              ) : invoices.length === 0 ? (
                <div className="glass rounded-[20px]">
                  <EmptyState
                    title="No invoices yet"
                    description="Generate one on the left once there are renewal charges to bill."
                  />
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {invoices.map((inv) => {
                    const sendable = periodHasEnded(
                      inv.periodType,
                      inv.periodValue,
                    );
                    return (
                      <li
                        key={inv.id}
                        className="glass flex flex-wrap items-center justify-between gap-3 rounded-[16px] px-4 py-3.5 md:px-5"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm font-medium tabular-nums">
                            {formatPeriodValue(inv.periodType, inv.periodValue)}
                          </span>
                          <span className="text-sm font-semibold tabular-nums">
                            {formatUsd(inv.totalAmountUsd)}
                          </span>
                          <InvoiceSentPill sentAt={inv.sentAt} />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoicePdf(inv)}
                            className="glass inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium hover:bg-accent"
                          >
                            <Download aria-hidden="true" className="size-3.5" />
                            PDF
                          </button>
                          {!inv.sentAt ? (
                            <button
                              type="button"
                              onClick={() => setSendingInvoice(inv)}
                              disabled={!sendable}
                              title={
                                sendable
                                  ? undefined
                                  : `Can't be sent until the period ends on ${formatDate(lastDayOfPeriodValue(inv.periodType, inv.periodValue).toISOString())}`
                              }
                              className="module-bg inline-flex h-9 items-center rounded-xl px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Send
                            </button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      <TopUpWalletDialog
        open={toppingUp}
        reseller={reseller}
        currentBalance={wallet?.balanceUsd ?? 0}
        onClose={() => setToppingUp(false)}
        onSuccess={() => {
          setToppingUp(false);
          setPage(1);
          setWalletRefreshKey((k) => k + 1);
        }}
      />

      <SendInvoiceDialog
        invoice={sendingInvoice}
        onClose={() => setSendingInvoice(null)}
        onSuccess={(updated) => {
          setSendingInvoice(null);
          applyInvoiceUpdate(updated);
        }}
      />
    </div>
  );
}
