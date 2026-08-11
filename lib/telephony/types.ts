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
export type RequestStatus = "pending" | "approved" | "rejected";

export interface AccessRequest {
  id: string;
  kind: RequestKind;
  module: ModuleKey;
  name: string;
  email: string;
  phone: string;
  company?: string | undefined;
  country?: string | undefined;
  website?: string | undefined;
  reason?: string | undefined;
  note?: string | undefined;
  submittedAt: string;
  status: RequestStatus;
  decisionReason?: string | undefined;
}

export type AuditAction =
  | "account.created"
  | "account.renewed"
  | "account.disabled"
  | "account.enabled"
  | "account.deleted"
  | "request.approved"
  | "request.rejected";

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
