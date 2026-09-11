import { apiFetch, toMySqlDatetime } from "./client";
import type { Reseller, ResellerStatus } from "@/lib/telephony/types";

interface BackendAdmin {
  id: string | number;
  username: string;
  email?: string;
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
    email: a.email ?? "",
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
  create: (input: {
    username: string;
    email: string;
    password: string;
    expiresAt: string;
    initialCredit?: number | undefined;
  }) =>
    apiFetch<BackendAdmin>("/admins", {
      method: "POST",
      body: JSON.stringify({
        username: input.username,
        email: input.email,
        password: input.password,
        expires_at: toMySqlDatetime(input.expiresAt),
        initialCredit: input.initialCredit || undefined,
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
  // Admin-only override for a reseller who's lost access — no step-up
  // re-confirmation of the admin's own password; an admin session already
  // carries this authority, same as disable/renew/etc. Self-service password
  // changes (an account changing its own) go through authApi.changePassword
  // instead, which does require the current password.
  resetPassword: (id: string, newPassword: string) =>
    apiFetch<{ message: string }>(`/admins/${id}/reset-password`, {
      method: "PATCH",
      body: JSON.stringify({ newPassword }),
    }),
};
