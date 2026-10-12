import { apiFetch, toMySqlDatetime } from "./client";
import type { SipAccount } from "@/lib/telephony/types";

interface BackendAccount {
  id: string | number;
  authid: string;
  domain: string;
  email?: string;
  created_at: string;
  status: string;
  expires_at: string;
  disabled_at: string | null;
  creator_id: string | number;
  created_by?: string;
  // Present only on the create response, only on success, and only once —
  // the backend can never return it again after this call. Never persisted
  // into SipAccount/mapAccount, so it can't end up in long-lived list state.
  qrPayload?: string;
}

function mapAccount(a: BackendAccount): SipAccount {
  return {
    id: String(a.id),
    sipId: `${a.authid}@${a.domain}`,
    displayName: a.authid,
    email: a.email ?? "",
    disabled: a.status === "disabled",
    expiresAt: a.expires_at,
    createdAt: a.created_at,
    createdById: String(a.creator_id),
    createdByName: a.created_by ?? "",
  };
}

export const accountsApi = {
  list: () =>
    apiFetch<BackendAccount[]>("/accounts").then((rows) =>
      rows.map(mapAccount),
    ),
  create: (input: {
    authid: string;
    domain: string;
    email: string;
    phone: string;
    password: string;
    expires_at: string;
    resellerId: string;
  }) =>
    apiFetch<BackendAccount>("/accounts", {
      method: "POST",
      body: JSON.stringify({
        ...input,
        expires_at: toMySqlDatetime(input.expires_at),
      }),
    }).then((a) => ({ account: mapAccount(a), qrPayload: a.qrPayload })),
  renew: (id: string, expiresAt: string) =>
    apiFetch<BackendAccount>(`/accounts/${id}/renew`, {
      method: "PATCH",
      body: JSON.stringify({ expires_at: toMySqlDatetime(expiresAt) }),
    }).then(mapAccount),
  disable: (id: string) =>
    apiFetch<BackendAccount>(`/accounts/${id}/disable`, {
      method: "PATCH",
    }).then(mapAccount),
  // Admin-only.
  reassign: (id: string, resellerId: string) =>
    apiFetch<BackendAccount>(`/accounts/${id}/reassign`, {
      method: "PATCH",
      body: JSON.stringify({ resellerId }),
    }).then(mapAccount),
  remove: (id: string) =>
    apiFetch<{ message: string }>(`/accounts/${id}`, { method: "DELETE" }),
  changePassword: (id: string, password: string) =>
    apiFetch<{ message: string; qrPayload?: string }>(
      `/accounts/${id}/password`,
      {
        method: "PATCH",
        body: JSON.stringify({ password }),
      },
    ).then((r) => ({ qrPayload: r.qrPayload })),
};
