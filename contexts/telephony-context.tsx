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
  AppNotification,
  MockUser,
  ModuleKey,
  Reseller,
  SipAccount,
} from "@/lib/telephony/types";
import { ApiError } from "@/lib/api/client";
import { authApi, type BackendUser } from "@/lib/api/auth";
import { accountsApi } from "@/lib/api/accounts";
import { resellersApi } from "@/lib/api/resellers";
import { notificationsApi } from "@/lib/api/notifications";
import { requestsApi, type SubmitRequestInput } from "@/lib/api/requests";
import {
  accountRequestsApi,
  type AccountRequestEntry,
} from "@/lib/api/account-requests";

type Theme = "light" | "dark";

interface Ctx {
  hydrated: boolean;
  user: MockUser | null;
  signIn: (identifier: string, password: string) => Promise<MockUser>;
  signOut: () => void;
  theme: Theme;
  toggleTheme: () => void;
  accounts: SipAccount[];
  accountsLoading: boolean;
  visibleAccounts: SipAccount[];
  createAccount: (input: {
    sipId: string;
    email: string;
    password: string;
    expiresAt: string;
    creatorId: string;
  }) => Promise<SipAccount>;
  renewAccount: (id: string, expiresAt: string) => Promise<void>;
  setDisabled: (id: string, disabled: boolean) => Promise<void>;
  reassignAccount: (id: string, creatorId: string) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  resellers: Reseller[];
  resellersLoading: boolean;
  createReseller: (input: {
    username: string;
    email: string;
    password: string;
    expiresAt: string;
    initialCredit?: number | undefined;
  }) => Promise<Reseller>;
  renewReseller: (id: string, expiresAt: string) => Promise<void>;
  setResellerStatus: (
    id: string,
    status: "active" | "disabled",
  ) => Promise<void>;
  resetResellerPassword: (id: string, newPassword: string) => Promise<void>;
  notifications: AppNotification[];
  notificationsLoading: boolean;
  unreadCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  submitRequest: (input: SubmitRequestInput) => Promise<void>;
  submitAccountRequests: (entries: AccountRequestEntry[]) => Promise<void>;
  hasModule: (m: ModuleKey) => boolean;
}

const TelephonyContext = createContext<Ctx | null>(null);
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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  // Real notifications only exist for admin/reseller sessions. No push
  // mechanism on the backend (pure REST) — poll for new ones instead. The
  // unread count is re-derived from a dedicated `unread=true&limit=1` call
  // rather than counting locally, since the recent list below is capped at
  // 20 and would undercount once there are more unread items than that.
  useEffect(() => {
    if (!user || user.role === "enduser") {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    let cancelled = false;
    async function load() {
      setNotificationsLoading(true);
      try {
        const [recent, unread] = await Promise.all([
          notificationsApi.list({ limit: 20 }),
          notificationsApi.list({ unread: true, limit: 1 }),
        ]);
        if (cancelled) return;
        setNotifications(recent.notifications);
        setUnreadCount(unread.pagination.total);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) setUser(null);
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
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
    signIn,
    signOut,
    theme,
    toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    accounts,
    accountsLoading,
    visibleAccounts,
    hasModule: (m) =>
      !!user && (user.role === "admin" || user.modules.includes(m)),
    createAccount: async (input) => {
      const [authid, domain] = input.sipId.split("@");
      try {
        const created = await accountsApi.create({
          authid: authid ?? input.sipId,
          domain: domain ?? "",
          email: input.email,
          password: input.password,
          expires_at: new Date(input.expiresAt).toISOString(),
          resellerId: input.creatorId,
        });
        setAccounts((prev) => [created, ...prev]);
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
      } catch (err) {
        handleApiError(err);
      }
    },
    reassignAccount: async (id, creatorId) => {
      try {
        const updated = await accountsApi.reassign(id, creatorId);
        setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      } catch (err) {
        handleApiError(err);
      }
    },
    deleteAccount: async (id) => {
      try {
        await accountsApi.remove(id);
        setAccounts((prev) => prev.filter((a) => a.id !== id));
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
        return created;
      } catch (err) {
        return handleApiError(err);
      }
    },
    renewReseller: async (id, expiresAt) => {
      try {
        const updated = await resellersApi.renew(id, expiresAt);
        setResellers((prev) => prev.map((r) => (r.id === id ? updated : r)));
      } catch (err) {
        handleApiError(err);
      }
    },
    setResellerStatus: async (id, status) => {
      try {
        const updated = await resellersApi.setStatus(id, status);
        setResellers((prev) => prev.map((r) => (r.id === id ? updated : r)));
      } catch (err) {
        handleApiError(err);
      }
    },
    resetResellerPassword: async (id, newPassword) => {
      try {
        await resellersApi.resetPassword(id, newPassword);
      } catch (err) {
        handleApiError(err);
      }
    },
    notifications,
    notificationsLoading,
    unreadCount,
    markNotificationRead: async (id) => {
      try {
        const updated = await notificationsApi.markRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? updated : n)),
        );
        const unread = await notificationsApi.list({
          unread: true,
          limit: 1,
        });
        setUnreadCount(unread.pagination.total);
      } catch (err) {
        handleApiError(err);
      }
    },
    markAllNotificationsRead: async () => {
      try {
        await notificationsApi.markAllRead();
        setNotifications((prev) =>
          prev.map((n) =>
            n.readAt ? n : { ...n, readAt: new Date().toISOString() },
          ),
        );
        setUnreadCount(0);
      } catch (err) {
        handleApiError(err);
      }
    },
    submitRequest: async (input) => {
      await requestsApi.submit(input);
    },
    submitAccountRequests: async (entries) => {
      await accountRequestsApi.submitBatch(entries);
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
