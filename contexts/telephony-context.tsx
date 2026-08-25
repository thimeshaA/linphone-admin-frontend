"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_ACCOUNTS, MOCK_USERS } from "@/lib/telephony/mock-data";
import type {
  AuditAction,
  AuditEvent,
  MockUser,
  ModuleKey,
  Reseller,
  SipAccount,
} from "@/lib/telephony/types";
import { ApiError } from "@/lib/api/client";
import { authApi, type BackendUser } from "@/lib/api/auth";
import { accountsApi } from "@/lib/api/accounts";
import { resellersApi } from "@/lib/api/resellers";
import { requestsApi, type SubmitRequestInput } from "@/lib/api/requests";

type Theme = "light" | "dark";

interface Ctx {
  hydrated: boolean;
  user: MockUser | null;
  users: MockUser[];
  signIn: (identifier: string, password: string) => Promise<MockUser>;
  signOut: () => void;
  impersonate: (userId: string) => MockUser | null;
  theme: Theme;
  toggleTheme: () => void;
  accounts: SipAccount[];
  accountsLoading: boolean;
  visibleAccounts: SipAccount[];
  auditEvents: AuditEvent[];
  createAccount: (input: {
    sipId: string;
    password: string;
    expiresAt: string;
  }) => Promise<SipAccount>;
  renewAccount: (id: string, expiresAt: string) => Promise<void>;
  setDisabled: (id: string, disabled: boolean) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  resellers: Reseller[];
  resellersLoading: boolean;
  createReseller: (input: {
    username: string;
    password: string;
    expiresAt: string;
  }) => Promise<Reseller>;
  renewReseller: (id: string, expiresAt: string) => Promise<void>;
  setResellerStatus: (
    id: string,
    status: "active" | "disabled",
  ) => Promise<void>;
  resetResellerPassword: (id: string, newPassword: string) => Promise<void>;
  submitRequest: (input: SubmitRequestInput) => Promise<void>;
  hasModule: (m: ModuleKey) => boolean;
}

export const TelephonyContext = createContext<Ctx | null>(null);
const SESSION_KEY = "flexi.session";
const THEME_KEY = "flexi.theme";
const wait = (ms = 620) => new Promise((r) => setTimeout(r, ms));

// The real backend only knows admin/reseller — the enduser demo has no
// backend counterpart, so it's the one role that stays mock-only end to end.
function toAppUser(u: BackendUser): MockUser {
  return {
    id: String(u.id),
    identifier: u.username,
    password: "",
    name: u.username,
    org: undefined,
    role: u.role,
    modules: ["sip"],
    accountId: undefined,
    blurb: "",
  };
}

export function TelephonyProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<MockUser | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [accounts, setAccounts] = useState<SipAccount[]>(MOCK_ACCOUNTS);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [resellersLoading, setResellersLoading] = useState(false);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

  const logEvent = useCallback(
    (
      module: ModuleKey,
      action: AuditAction,
      target: string,
      detail?: string,
    ) => {
      setAuditEvents((prev) => [
        {
          id: `evt-${Math.random().toString(36).slice(2, 9)}`,
          module,
          action,
          actorId: user?.id ?? "system",
          actorName: user?.name ?? "System",
          target,
          detail,
          at: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [user],
  );

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    // Dark-first product: only an explicit stored preference leaves dark.
    setTheme(storedTheme ?? "dark");

    (async () => {
      const id = localStorage.getItem(SESSION_KEY);
      const mockUser = id
        ? (MOCK_USERS.find((u) => u.id === id && u.role === "enduser") ?? null)
        : null;
      if (mockUser) {
        setUser(mockUser);
      } else {
        try {
          const me = await authApi.me();
          setUser(toAppUser(me));
        } catch {
          // No real session either — stay signed out.
        }
      }
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    if (hydrated) localStorage.setItem(THEME_KEY, theme);
  }, [theme, hydrated]);

  // Real accounts only exist for admin/reseller sessions — the enduser demo
  // keeps reading straight from MOCK_ACCOUNTS via visibleAccounts below.
  useEffect(() => {
    if (!user || user.role === "enduser") return;
    let cancelled = false;
    setAccountsLoading(true);
    accountsApi
      .list()
      .then((list) => {
        if (!cancelled) setAccounts(list);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setAccountsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // /api/admins is admin-only (resellers get a 403) — only fetch for admins.
  useEffect(() => {
    if (user?.role !== "admin") {
      setResellers([]);
      return;
    }
    let cancelled = false;
    setResellersLoading(true);
    resellersApi
      .list()
      .then((list) => {
        if (!cancelled) setResellers(list);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setResellersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const mockMatch = MOCK_USERS.find(
      (u) =>
        u.role === "enduser" &&
        u.identifier.toLowerCase() === identifier.trim().toLowerCase(),
    );
    if (mockMatch) {
      await wait(900);
      if (mockMatch.password !== password) {
        throw new Error("INVALID_CREDENTIALS");
      }
      localStorage.setItem(SESSION_KEY, mockMatch.id);
      setUser(mockMatch);
      return mockMatch;
    }

    try {
      const real = await authApi.login(identifier.trim(), password);
      const appUser = toAppUser(real);
      setUser(appUser);
      return appUser;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        throw new Error("INVALID_CREDENTIALS");
      }
      if (err instanceof ApiError && err.status === 403) {
        throw new Error("ACCOUNT_DISABLED");
      }
      throw new Error("GENERAL");
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    // AppShell mirrors the active workspace's accent onto <html> so
    // portalled dialogs/menus can inherit it (see app-shell.tsx); that
    // attribute otherwise survives sign-out (the element itself is never
    // unmounted) and leaks whatever colour the user was last in — e.g. a
    // green admin page turning cyan/orange — onto every page rendered
    // afterwards that relies on the ambient module colour instead of
    // setting its own.
    delete document.documentElement.dataset["module"];
    void authApi.logout().catch(() => {});
  }, []);

  const impersonate = useCallback((userId: string) => {
    const found = MOCK_USERS.find((u) => u.id === userId) ?? null;
    if (found) localStorage.setItem(SESSION_KEY, found.id);
    setUser(found);
    return found;
  }, []);

  const visibleAccounts = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") return accounts;
    if (user.role === "reseller")
      return accounts.filter((a) => a.createdById === user.id);
    return accounts.filter((a) => a.id === user.accountId);
  }, [accounts, user]);

  const handleApiError = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.status === 401) setUser(null);
    throw err;
  }, []);

  const value: Ctx = {
    hydrated,
    user,
    users: MOCK_USERS,
    signIn,
    signOut,
    impersonate,
    theme,
    toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    accounts,
    accountsLoading,
    visibleAccounts,
    auditEvents,
    hasModule: (m) =>
      !!user && (user.role === "admin" || user.modules.includes(m)),
    createAccount: async (input) => {
      const [authid, domain] = input.sipId.split("@");
      try {
        const created = await accountsApi.create({
          authid: authid ?? input.sipId,
          domain: domain ?? "",
          password: input.password,
          expires_at: new Date(input.expiresAt).toISOString(),
        });
        setAccounts((prev) => [created, ...prev]);
        logEvent("sip", "account.created", created.sipId);
        return created;
      } catch (err) {
        return handleApiError(err);
      }
    },
    renewAccount: async (id, expiresAt) => {
      try {
        const updated = await accountsApi.renew(
          id,
          new Date(expiresAt).toISOString(),
        );
        setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
        logEvent(
          "sip",
          "account.renewed",
          updated.sipId,
          `New expiry ${new Date(expiresAt).toLocaleDateString("en-GB")}`,
        );
      } catch (err) {
        handleApiError(err);
      }
    },
    setDisabled: async (id, disabled) => {
      try {
        const updated = disabled
          ? await accountsApi.disable(id)
          : await accountsApi.renew(
              id,
              accounts.find((a) => a.id === id)?.expiresAt ??
                new Date().toISOString(),
            );
        setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
        logEvent(
          "sip",
          disabled ? "account.disabled" : "account.enabled",
          updated.sipId,
        );
      } catch (err) {
        handleApiError(err);
      }
    },
    deleteAccount: async (id) => {
      try {
        await accountsApi.remove(id);
        const target = accounts.find((a) => a.id === id);
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        logEvent("sip", "account.deleted", target?.sipId ?? id);
      } catch (err) {
        handleApiError(err);
      }
    },
    resellers,
    resellersLoading,
    createReseller: async (input) => {
      try {
        const created = await resellersApi.create(input);
        setResellers((prev) => [created, ...prev]);
        logEvent("sip", "reseller.created", created.username);
        return created;
      } catch (err) {
        return handleApiError(err);
      }
    },
    renewReseller: async (id, expiresAt) => {
      try {
        const updated = await resellersApi.renew(id, expiresAt);
        setResellers((prev) => prev.map((r) => (r.id === id ? updated : r)));
        logEvent(
          "sip",
          "reseller.renewed",
          updated.username,
          `New expiry ${new Date(expiresAt).toLocaleDateString("en-GB")}`,
        );
      } catch (err) {
        handleApiError(err);
      }
    },
    setResellerStatus: async (id, status) => {
      try {
        const updated = await resellersApi.setStatus(id, status);
        setResellers((prev) => prev.map((r) => (r.id === id ? updated : r)));
        logEvent(
          "sip",
          status === "disabled" ? "reseller.disabled" : "reseller.enabled",
          updated.username,
        );
      } catch (err) {
        handleApiError(err);
      }
    },
    resetResellerPassword: async (id, newPassword) => {
      try {
        await resellersApi.resetPassword(id, newPassword);
        const target = resellers.find((r) => r.id === id);
        logEvent("sip", "reseller.password_reset", target?.username ?? id);
      } catch (err) {
        handleApiError(err);
      }
    },
    submitRequest: async (input) => {
      await requestsApi.submit(input);
    },
  };

  return (
    <TelephonyContext.Provider value={value}>
      {children}
    </TelephonyContext.Provider>
  );
}

export function useTelephony() {
  const ctx = useContext(TelephonyContext);
  if (!ctx)
    throw new Error("useTelephony must be used inside TelephonyProvider");
  return ctx;
}
