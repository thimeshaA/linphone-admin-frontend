export type ModuleKey = "sip" | "esim";
export type Role = "admin" | "reseller" | "enduser";

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

export type RequestKind = "reseller" | "account";

export type AuditAction =
  | "account.created"
  | "account.renewed"
  | "account.disabled"
  | "account.enabled"
  | "account.deleted"
  | "reseller.created"
  | "reseller.renewed"
  | "reseller.password_reset"
  | "reseller.disabled"
  | "reseller.enabled";

export interface AuditEvent {
  id: string;
  module: ModuleKey;
  action: AuditAction;
  actorId: string;
  actorName: string;
  target: string;
  detail?: string | undefined;
  at: string;
}
