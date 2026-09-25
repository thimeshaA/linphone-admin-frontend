"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Receipt, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";
import { invoicesApi } from "@/lib/api/invoices";
import type { ReportPeriod } from "@/lib/api/reports";
import type { Invoice, Reseller } from "@/lib/telephony/types";
import { formatDate } from "@/lib/telephony/status";
import { cn } from "@/lib/utils";
import {
  lastDayOfPeriodValue,
  periodHasEnded,
  periodLabel,
  PeriodSelect,
} from "./period-select";
import { InvoiceSentPill } from "./status-pill";
import { formatUsd } from "./wallet-balance";

const primaryBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-module px-5 text-sm font-semibold text-ink transition-transform active:scale-[0.98] disabled:opacity-60";
const ghostBtn =
  "inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-5 text-sm font-medium";

function periodToApi(period: ReportPeriod) {
  return period.type === "monthly"
    ? {
        periodType: "monthly" as const,
        periodValue: `${period.year}-${String(period.month).padStart(2, "0")}`,
      }
    : { periodType: "annual" as const, periodValue: String(period.year) };
}

/**
 * Admin-only: pick a billing period for a reseller — the same Monthly/Annual
 * picker Reports uses (`PeriodSelect`, not a separate pattern) — generate
 * the invoice for every not-yet-invoiced renewal charge in that window, then
 * preview the resulting PDF before anyone decides to send it. Generation and
 * sending are deliberately two separate steps, never combined.
 *
 * Plain inline content, no `Dialog` shell — embedded directly on the wallet
 * detail page rather than requiring navigation to a modal or a separate
 * page. (Previously this was a `GenerateInvoiceDialog` modal opened from
 * the now-retired `ResellerWalletDialog`; that trigger point is gone, so
 * this is the flow's only home now.)
 */
export function InvoiceGenerator({
  reseller,
  onGenerated,
}: {
  reseller: Reseller;
  onGenerated?: (invoice: Invoice) => void;
}) {
  const now = new Date();
  const [step, setStep] = useState<"period" | "preview">("period");
  const [period, setPeriod] = useState<ReportPeriod>({
    type: "monthly",
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [sending, setSending] = useState(false);
  const locked = invoice
    ? !periodHasEnded(invoice.periodType, invoice.periodValue)
    : false;

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const created = await invoicesApi.create({
        resellerId: reseller.id,
        ...periodToApi(period),
      });
      setInvoice(created);
      setStep("preview");
      onGenerated?.(created);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not generate the invoice.",
      );
    } finally {
      setGenerating(false);
    }
  }

  function handleReset() {
    setStep("period");
    setInvoice(null);
    setError("");
  }

  async function handleSend() {
    if (!invoice) return;
    setSending(true);
    try {
      const updated = await invoicesApi.send(invoice.id);
      setInvoice(updated);
      toast.success(`Invoice #${updated.id} sent`, {
        description: "The reseller has been emailed a copy of the PDF.",
      });
    } catch (err) {
      toast.error("Could not send the invoice", {
        description:
          err instanceof ApiError
            ? err.message
            : "The backend rejected the request. Try again.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="glass glass-hairline space-y-4 rounded-[20px] p-6">
      <div className="lg:flex lg:items-start lg:gap-8">
        <div className="lg:w-64 lg:shrink-0">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-2xl bg-neutral-pill text-muted-foreground"
            >
              <Receipt className="size-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold tracking-tight">
                {step === "period" ? "Generate invoice" : "Invoice preview"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {step === "period"
                  ? `Choose the period to bill ${reseller.username} for - covers every renewal charge in that window not already invoiced.`
                  : `${periodLabel(period)} — review the PDF before sending.`}
              </p>
            </div>
          </div>

          {step === "period" ? (
            <button
              type="button"
              className={cn(primaryBtn, "mt-4 w-full")}
              disabled={generating}
              onClick={handleGenerate}
            >
              {generating ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              {generating ? "Generating…" : "Generate invoice"}
            </button>
          ) : invoice ? (
            <div className="mt-4 flex flex-col gap-2">
              <button type="button" className={ghostBtn} onClick={handleReset}>
                Choose a different period
              </button>
              <button
                type="button"
                className={cn(primaryBtn, "w-full")}
                disabled={!!invoice.sentAt || sending || locked}
                title={
                  locked && !invoice.sentAt
                    ? `Can't be sent until the period ends on ${formatDate(lastDayOfPeriodValue(invoice.periodType, invoice.periodValue).toISOString())}`
                    : undefined
                }
                onClick={handleSend}
              >
                {sending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Mail aria-hidden="true" className="size-4" />
                )}
                {invoice.sentAt ? "Sent" : sending ? "Sending…" : "Send email"}
              </button>
            </div>
          ) : null}
        </div>

        {step === "period" ? (
          <div className="mt-4 lg:mt-0 lg:flex-1">
            <PeriodSelect value={period} onChange={setPeriod} />
          </div>
        ) : invoice ? (
          <div className="mt-4 lg:mt-0 lg:flex-1">
            <InvoicePreviewInline invoice={invoice} />
          </div>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-negative-muted px-4 py-3 text-sm text-negative-foreground"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function InvoicePreviewInline({ invoice }: { invoice: Invoice }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState("");
  const locked = !periodHasEnded(invoice.periodType, invoice.periodValue);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    invoicesApi
      .pdf(invoice.id)
      .then(({ blob }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      })
      .catch((err) => {
        if (!cancelled) {
          setPdfError(
            err instanceof ApiError ? err.message : "Could not load the PDF.",
          );
        }
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [invoice.id]);

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-xl bg-background p-4">
        <div>
          <p className="label-meta">Total</p>
          <p className="mt-1 text-lg font-semibold">
            {formatUsd(invoice.totalAmountUsd)}
          </p>
        </div>
        <InvoiceSentPill sentAt={invoice.sentAt} />
      </div>

      {pdfError ? (
        <p
          role="alert"
          className="rounded-xl bg-negative-muted px-4 py-3 text-sm text-negative-foreground"
        >
          {pdfError}
        </p>
      ) : pdfUrl ? (
        <iframe
          src={pdfUrl}
          title={`Invoice #${invoice.id} PDF preview`}
          className="h-[420px] w-full rounded-xl border border-border bg-white"
        />
      ) : (
        <div className="glass grid h-[420px] place-items-center rounded-xl">
          <Loader2
            aria-hidden="true"
            className="size-6 animate-spin text-muted-foreground"
          />
        </div>
      )}

      {locked && !invoice.sentAt ? (
        <p className="text-xs text-muted-foreground">
          Can&apos;t be sent until the period ends on{" "}
          {formatDate(
            lastDayOfPeriodValue(
              invoice.periodType,
              invoice.periodValue,
            ).toISOString(),
          )}
          . Generating and previewing stay available until then.
        </p>
      ) : null}
    </>
  );
}

/** Admin-only: confirm-and-send for the invoices list row action — unlike
 * the immediate "Send email" button inside `InvoicePreviewInline` (which is
 * already gated behind having just reviewed the PDF), a list row has no
 * preceding review step, so this gets its own lightweight confirmation. */
export function SendInvoiceDialog({
  invoice,
  onClose,
  onSuccess,
}: {
  invoice: Invoice | null;
  onClose: () => void;
  onSuccess: (updated: Invoice) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const locked = invoice
    ? !periodHasEnded(invoice.periodType, invoice.periodValue)
    : false;

  function handleClose() {
    setError("");
    onClose();
  }

  return (
    <Dialog
      open={!!invoice}
      onOpenChange={(v) => (!v ? handleClose() : undefined)}
    >
      <DialogContent className="rounded-[20px] sm:max-w-md">
        <DialogHeader>
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-2xl bg-neutral-pill text-muted-foreground"
          >
            <Send className="size-5" />
          </span>
          <DialogTitle className="font-display text-xl">
            Send this invoice?
          </DialogTitle>
          <DialogDescription>
            {invoice
              ? `Emails a PDF copy of invoice #${invoice.id} (${formatUsd(invoice.totalAmountUsd)}) to the reseller and marks it as sent.`
              : null}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p role="alert" className="text-xs text-negative-foreground">
            {error}
          </p>
        ) : locked && invoice ? (
          <p className="text-xs text-muted-foreground">
            Can&apos;t be sent until the period ends on{" "}
            {formatDate(
              lastDayOfPeriodValue(
                invoice.periodType,
                invoice.periodValue,
              ).toISOString(),
            )}
            .
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-2">
          <button type="button" className={ghostBtn} onClick={handleClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryBtn}
            disabled={loading || locked}
            title={
              locked && invoice
                ? `Can't be sent until the period ends on ${formatDate(lastDayOfPeriodValue(invoice.periodType, invoice.periodValue).toISOString())}`
                : undefined
            }
            onClick={async () => {
              if (!invoice) return;
              setLoading(true);
              setError("");
              try {
                const updated = await invoicesApi.send(invoice.id);
                toast.success(`Invoice #${invoice.id} sent`, {
                  description:
                    "The reseller has been emailed a copy of the PDF.",
                });
                onSuccess(updated);
              } catch (err) {
                setError(
                  err instanceof ApiError
                    ? err.message
                    : "Could not send the invoice.",
                );
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            {loading ? "Sending…" : "Send email"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
