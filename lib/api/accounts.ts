import { apiFetch, toMySqlDatetime } from "./client";
import type { SipAccount } from "@/lib/telephony/types";

interface BackendAccount {
  id: string | number;
  authid: string;
  domain: string;
  created_at: string;
  status: string;
  expires_at: string;
  disabled_at: string | null;
  expired_at: string | null;
  creator_id: string | number;
  created_by?: string;
}

function mapAccount(a: BackendAccount): SipAccount {
  return {
    id: String(a.id),
    sipId: `${a.authid}@${a.domain}`,
    displayName: a.authid,
    email: "",
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
    password: string;
    expires_at: string;
  }) =>
    apiFetch<BackendAccount>("/accounts", {
      method: "POST",
      body: JSON.stringify({
        ...input,
        expires_at: toMySqlDatetime(input.expires_at),
      }),
    }).then(mapAccount),
  renew: (id: string, expiresAt: string) =>
    apiFetch<BackendAccount>(`/accounts/${id}/renew`, {
      method: "PATCH",
      body: JSON.stringify({ expires_at: toMySqlDatetime(expiresAt) }),
    }).then(mapAccount),
  disable: (id: string) =>
    apiFetch<BackendAccount>(`/accounts/${id}/disable`, {
      method: "PATCH",
    }).then(mapAccount),
  remove: (id: string) =>
    apiFetch<{ message: string }>(`/accounts/${id}`, { method: "DELETE" }),
};
