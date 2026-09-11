export type ModuleKey = "sip";
type Role = "admin" | "reseller" | "enduser";

export interface MockUser {
  id: string;
  identifier: string;
  password: string;
  name: string;
  org?: string | undefined;
  role: Role;
  modules: ModuleKey[];
  /** for end-users: the sip account they own */
  accountId?: string | undefined;
  blurb: string;
}

export type ResellerStatus = "active" | "disabled" | "expired";

/** A reseller login backed by the real /api/admins backend — SIP module only. */
export interface Reseller {
  id: string;
  username: string;
  email: string;
  status: ResellerStatus;
  expiresAt: string | null;
  expiredAt: string | null;
  createdAt: string;
}

export type AccountStatus = "active" | "expiring" | "disabled" | "expired";

export interface SipAccount {
  id: string;
  sipId: string;
  displayName: string;
  email: string;
  disabled: boolean;
  expiresAt: string; // ISO date
  createdAt: string;
  createdById: string;
  createdByName: string;
  notes?: string | undefined;
}

export type WalletLedgerType =
  "initial_credit" | "admin_topup" | "renewal_deduction" | "payment_received";

export interface WalletLedgerEntry {
  id: string;
  type: WalletLedgerType;
  amountUsd: number;
  relatedAccountId: string | null;
  invoiced: boolean;
  invoiceId: string | null;
  createdBy: string | null;
  note: string | null;
  createdAt: string;
}

export interface Wallet {
  resellerId: string;
  balanceUsd: number;
  owedAccounts: number;
  updatedAt: string;
  ledger: WalletLedgerEntry[];
  pagination: { page: number; limit: number; total: number };
}

export type InvoicePeriodType = "monthly" | "annual";

// Period-based, generated from every not-yet-invoiced renewal deduction in
// the window — one invoice per reseller per period (DB-enforced). No
// payment/status tracking exists here at all; `sentAt` (nullable) is the
// only state an invoice has. Payments are handled entirely through wallet
// top-ups (Phase 6), not through anything invoice-related. Line items live
// only inside the generated PDF, never in this row.
export interface Invoice {
  id: string;
  resellerId: string;
  periodType: InvoicePeriodType;
  periodValue: string; // "YYYY-MM" for monthly, "YYYY" for annual
  totalAmountUsd: number;
  createdAt: string;
  sentAt: string | null;
}

// `type` is a free-form VARCHAR(50) on the backend (new types can be added
// there without a schema change), so this stays a plain string rather than a
// closed union — unknown types are expected and rendered with a fallback.
export interface AppNotification {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export type RequestKind = "reseller";
