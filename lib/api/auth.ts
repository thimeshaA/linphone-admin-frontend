import { apiFetch } from "./client";

export interface BackendUser {
  id: string | number;
  username: string;
  role: "admin" | "reseller";
}

export const authApi = {
  login: (username: string, password: string) =>
    apiFetch<BackendUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () =>
    apiFetch<{ message: string }>("/auth/logout", { method: "POST" }),
  me: () => apiFetch<BackendUser>("/auth/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ message: string }>("/auth/change-password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};
