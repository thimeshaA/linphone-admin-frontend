import { apiFetch, apiFetchBlob } from "./client";
import type { Invoice, InvoicePeriodType } from "@/lib/telephony/types";

interface BackendInvoice {
  id: number;
  reseller_id: string;
  period_type: InvoicePeriodType;
  period_value: string;
  total_amount_usd: number;
  created_at: string;
  sent_at: string | null;
}

function mapInvoice(i: BackendInvoice): Invoice {
  return {
    id: String(i.id),
    resellerId: String(i.reseller_id),
    periodType: i.period_type,
    periodValue: i.period_value,
    totalAmountUsd: Number(i.total_amount_usd),
    createdAt: i.created_at,
    sentAt: i.sent_at,
  };
}

export const invoicesApi = {
  // Ownership-scoped for both roles. Admins see every invoice for the
  // reseller (optionally filtered by `resellerId`), sent or not; a reseller
  // sees only their own AND only ones that have actually been sent — the
  // backend forces `sentOnly` for non-admins, not just the PDF endpoint.
  list: (params?: { resellerId?: string | undefined }) => {
    const query = new URLSearchParams();
    if (params?.resellerId) query.set("resellerId", params.resellerId);
    const qs = query.toString();
    return apiFetch<BackendInvoice[]>(`/invoices${qs ? `?${qs}` : ""}`).then(
      (rows) => rows.map(mapInvoice),
    );
  },
  // Admin-only. `periodValue` is "YYYY-MM" for monthly or "YYYY" for annual
  // — the same period-slug format /api/reports/* uses. Pulls every
  // not-yet-invoiced renewal deduction in that window for the reseller (a
  // full-year rollup for annual periods); the total is computed
  // server-side. Regenerating for a reseller+period that already has an
  // invoice replaces it in place (200, same id) rather than erroring.
  create: (input: {
    resellerId: string;
    periodType: InvoicePeriodType;
    periodValue: string;
  }) =>
    apiFetch<BackendInvoice>("/invoices", {
      method: "POST",
      body: JSON.stringify({
        resellerId: input.resellerId,
        periodType: input.periodType,
        periodValue: input.periodValue,
      }),
    }).then(mapInvoice),
  // Generated on demand, never stored — an unsent invoice 404s for a
  // reseller (admin can always fetch it).
  pdf: (id: string) => apiFetchBlob(`/invoices/${id}/pdf`),
  // Admin-only. Emails the PDF and stamps sent_at — the only sent-state
  // signal this API has, not a boolean and not a status enum.
  send: (id: string) =>
    apiFetch<BackendInvoice>(`/invoices/${id}/send`, {
      method: "POST",
    }).then(mapInvoice),
};
