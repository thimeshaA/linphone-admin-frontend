import { apiFetch, toMySqlDatetime } from "./client";
import type { Reseller, ResellerStatus } from "@/lib/telephony/types";

interface BackendAdmin {
  id: string | number;
  username: string;
  role: "admin" | "reseller";
  status: ResellerStatus;
  expires_at: string | null;
  expired_at: string | null;
  created_at?: string;
}

function mapReseller(a: BackendAdmin): Reseller {
  return {
    id: String(a.id),
    username: a.username,
    status: a.status,
    expiresAt: a.expires_at,
    expiredAt: a.expired_at,
    // POST /admins doesn't return created_at — approximate with now().
    createdAt: a.created_at ?? new Date().toISOString(),
  };
}

export const resellersApi = {
  list: () =>
    apiFetch<BackendAdmin[]>("/admins").then((rows) => rows.map(mapReseller)),
  create: (input: { username: string; password: string; expiresAt: string }) =>
    apiFetch<BackendAdmin>("/admins", {
      method: "POST",
      body: JSON.stringify({
        username: input.username,
        password: input.password,
        expires_at: toMySqlDatetime(input.expiresAt),
      }),
    }).then(mapReseller),
  renew: (id: string, expiresAt: string) =>
    apiFetch<BackendAdmin>(`/admins/${id}/renew`, {
      method: "PATCH",
      body: JSON.stringify({ expires_at: toMySqlDatetime(expiresAt) }),
    }).then(mapReseller),
  // "expired" is server-set only (on a lazy login-time check) — never settable here.
  setStatus: (id: string, status: "active" | "disabled") =>
    apiFetch<BackendAdmin>(`/admins/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }).then(mapReseller),
  resetPassword: (id: string, newPassword: string) =>
    apiFetch<{ message: string }>(`/admins/${id}/reset-password`, {
      method: "PATCH",
      body: JSON.stringify({ newPassword }),
    }),
};
