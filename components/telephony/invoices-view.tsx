"use client";

import { useEffect, useState } from "react";
import { Download, Receipt } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader } from "./primitives";
import { InvoiceSentPill } from "./status-pill";
import { SendInvoiceDialog } from "./invoice-dialogs";
import {
  formatPeriodValue,
  lastDayOfPeriodValue,
  periodHasEnded,
} from "./period-select";
import { formatDate } from "@/lib/telephony/status";
import { useTelephony } from "@/contexts/telephony-context";
import { ApiError } from "@/lib/api/client";
import { invoicesApi } from "@/lib/api/invoices";
import type { Invoice } from "@/lib/telephony/types";
import { downloadBlob } from "@/lib/utils";
import { formatUsd } from "./wallet-balance";

/** Browsable invoice history — both roles. Admin gets a reseller filter plus
 * the send action; a reseller sees only their own AND only ones that have
 * actually been sent (the backend forces that scoping, not this page —
 * there is no draft/paid concept here, just sent vs. not-sent). Payments
 * aren't part of this flow at all — they're wallet top-ups (Phase 6). */
export function InvoicesView() {
  const { user, resellers } = useTelephony();
  const isAdmin = user?.role === "admin";
  const [resellerFilter, setResellerFilter] = useState("all");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!user || user.role === "enduser") return;
    let cancelled = false;
    setLoading(true);
    setError("");
    invoicesApi
      .list({
        resellerId:
          isAdmin && resellerFilter !== "all" ? resellerFilter : undefined,
      })
      .then((rows) => {
        if (!cancelled) setInvoices(rows);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : "Could not load invoices.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isAdmin, resellerFilter]);

  function resellerName(id: string) {
    return resellers.find((r) => r.id === id)?.username ?? `Reseller #${id}`;
  }

  async function handleDownloadPdf(invoice: Invoice) {
    try {
      const { blob, filename } = await invoicesApi.pdf(invoice.id);
      // filename comes from the backend's Content-Disposition header (e.g.
      // "invoice-acme_reseller-2026-08.pdf") - this fallback only kicks in
      // if that header is ever missing.
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

  function applyUpdate(updated: Invoice) {
    setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  const actionsFor = (inv: Invoice) => (
    <>
      {isAdmin || inv.sentAt ? (
        <button
          type="button"
          onClick={() => handleDownloadPdf(inv)}
          className="glass inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium hover:bg-accent"
        >
          <Download aria-hidden="true" className="size-3.5" />
          PDF
        </button>
      ) : null}
      {isAdmin && !inv.sentAt ? (
        <button
          type="button"
          onClick={() => setSending(inv)}
          disabled={!periodHasEnded(inv.periodType, inv.periodValue)}
          title={
            periodHasEnded(inv.periodType, inv.periodValue)
              ? undefined
              : `Can't be sent until the period ends on ${formatDate(lastDayOfPeriodValue(inv.periodType, inv.periodValue).toISOString())}`
          }
          className="module-bg inline-flex h-9 items-center rounded-xl px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      ) : null}
    </>
  );

  return (
    <div className="space-y-10">
      <PageHeader
        module="sip"
        eyebrow="Reseller management"
        title="Invoices"
        description={
          isAdmin
            ? "Generate, send and track period invoices for renewal charges across resellers."
            : "Invoices issued for your renewal charges."
        }
      />

      {isAdmin ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="sr-only" htmlFor="invoice-reseller-filter">
            Filter by reseller
          </label>
          <select
            id="invoice-reseller-filter"
            value={resellerFilter}
            onChange={(e) => setResellerFilter(e.target.value)}
            className="glass h-9 rounded-full px-3 font-mono text-[11px] tracking-wider uppercase outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All resellers</option>
            {resellers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.username}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-negative-muted px-4 py-3 text-sm text-negative-foreground"
        >
          {error}
        </p>
      ) : loading && invoices.length === 0 ? (
        <div className="glass rounded-[20px]">
          <EmptyState
            title="Loading invoices…"
            description="Fetching invoice history."
          />
        </div>
      ) : invoices.length === 0 ? (
        <div className="glass rounded-[20px]">
          <EmptyState
            icon={<Receipt aria-hidden="true" className="size-5" />}
            title="No invoices yet"
            description={
              isAdmin
                ? "Generate one from a reseller's wallet panel."
                : "Invoices will show up here once issued."
            }
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="glass hidden overflow-x-auto rounded-[20px] md:block">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">
                Invoices with reseller, period, amount, sent state and actions
              </caption>
              <thead>
                <tr className="border-b border-border">
                  {(isAdmin
                    ? ["Reseller", "Period", "Amount", "Sent"]
                    : ["Period", "Amount", "Sent"]
                  ).map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="label-meta px-5 py-3.5 text-left"
                    >
                      {h}
                    </th>
                  ))}
                  <th scope="col" className="label-meta px-5 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-border last:border-0 hover:bg-accent/30"
                  >
                    {isAdmin ? (
                      <td className="px-5 py-4 font-mono text-xs">
                        {resellerName(inv.resellerId)}
                      </td>
                    ) : null}
                    <td className="px-5 py-4 tabular-nums">
                      {formatPeriodValue(inv.periodType, inv.periodValue)}
                    </td>
                    <td className="px-5 py-4 tabular-nums font-medium">
                      {formatUsd(inv.totalAmountUsd)}
                    </td>
                    <td className="px-5 py-4">
                      <InvoiceSentPill sentAt={inv.sentAt} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {actionsFor(inv)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {invoices.map((inv) => (
              <li key={inv.id} className="glass rounded-[20px] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {isAdmin ? (
                      <p className="truncate font-mono text-sm font-medium">
                        {resellerName(inv.resellerId)}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {formatPeriodValue(inv.periodType, inv.periodValue)}
                    </p>
                  </div>
                  <InvoiceSentPill sentAt={inv.sentAt} className="shrink-0" />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold tabular-nums">
                    {formatUsd(inv.totalAmountUsd)}
                  </p>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {actionsFor(inv)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <SendInvoiceDialog
        invoice={sending}
        onClose={() => setSending(null)}
        onSuccess={(updated) => {
          setSending(null);
          applyUpdate(updated);
        }}
      />
    </div>
  );
}
