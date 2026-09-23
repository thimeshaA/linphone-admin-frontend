import { apiFetch } from "./client";
import type {
  Wallet,
  WalletLedgerEntry,
  WalletLedgerType,
} from "@/lib/telephony/types";

interface BackendLedgerEntry {
  id: number;
  reseller_id: number;
  type: WalletLedgerType;
  amount_usd: number;
  related_account_id: number | null;
  account_sip_id: string | null;
  invoiced: 0 | 1;
  invoice_id: number | null;
  created_by: number | null;
  note: string | null;
  created_at: string;
}

interface BackendWallet {
  resellerId: number;
  balanceUsd: number;
  owedAccounts: number;
  updatedAt: string;
  ledger: BackendLedgerEntry[];
  pagination: { page: number; limit: number; total: number };
}

function mapLedgerEntry(e: BackendLedgerEntry): WalletLedgerEntry {
  return {
    id: String(e.id),
    type: e.type,
    amountUsd: e.amount_usd,
    relatedAccountId:
      e.related_account_id !== null ? String(e.related_account_id) : null,
    accountSipId: e.account_sip_id,
    invoiced: Boolean(e.invoiced),
    invoiceId: e.invoice_id !== null ? String(e.invoice_id) : null,
    createdBy: e.created_by !== null ? String(e.created_by) : null,
    note: e.note,
    createdAt: e.created_at,
  };
}

function mapWallet(w: BackendWallet): Wallet {
  return {
    resellerId: String(w.resellerId),
    balanceUsd: w.balanceUsd,
    owedAccounts: w.owedAccounts,
    updatedAt: w.updatedAt,
    ledger: w.ledger.map(mapLedgerEntry),
    pagination: w.pagination,
  };
}

export const walletApi = {
  get: (resellerId: string, params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return apiFetch<BackendWallet>(
      `/resellers/${resellerId}/wallet${qs ? `?${qs}` : ""}`,
    ).then(mapWallet);
  },
  // Admin-only.
  topup: (
    resellerId: string,
    input: { amount: number; note?: string | undefined },
  ) =>
    apiFetch<{ resellerId: number; balanceUsd: number }>(
      `/resellers/${resellerId}/wallet/topup`,
      {
        method: "POST",
        body: JSON.stringify({
          amount: input.amount,
          note: input.note || undefined,
        }),
      },
    ),
};
