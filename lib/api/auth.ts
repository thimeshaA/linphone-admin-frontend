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
  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    apiFetch<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),
};
