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
import {
  MOCK_ACCOUNTS,
  MOCK_REQUESTS,
  MOCK_USERS,
} from "@/lib/telephony/mock-data";
import type {
  AccessRequest,
  AuditAction,
  AuditEvent,
  MockUser,
  ModuleKey,
  SipAccount,
} from "@/lib/telephony/types";

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
  visibleAccounts: SipAccount[];
  requests: AccessRequest[];
  auditEvents: AuditEvent[];
  createAccount: (input: {
    sipId: string;
    displayName: string;
    email: string;
    expiresAt: string;
    notes?: string | undefined;
  }) => Promise<SipAccount>;
  renewAccount: (id: string, expiresAt: string) => Promise<void>;
  setDisabled: (id: string, disabled: boolean) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  decideRequest: (
    id: string,
    status: "approved" | "rejected",
    reason?: string,
  ) => Promise<void>;
  submitRequest: (
    input: Omit<AccessRequest, "id" | "submittedAt" | "status">,
  ) => Promise<void>;
  hasModule: (m: ModuleKey) => boolean;
}

const TelephonyContext = createContext<Ctx | null>(null);
const SESSION_KEY = "flexi.session";
const THEME_KEY = "flexi.theme";
const wait = (ms = 620) => new Promise((r) => setTimeout(r, ms));

export function TelephonyProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<MockUser | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [accounts, setAccounts] = useState<SipAccount[]>(MOCK_ACCOUNTS);
  const [requests, setRequests] = useState<AccessRequest[]>(MOCK_REQUESTS);
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
    const id = localStorage.getItem(SESSION_KEY);
    if (id) setUser(MOCK_USERS.find((u) => u.id === id) ?? null);
    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    if (hydrated) localStorage.setItem(THEME_KEY, theme);
  }, [theme, hydrated]);

  const signIn = useCallback(async (identifier: string, password: string) => {
    await wait(900);
    const found = MOCK_USERS.find(
      (u) => u.identifier.toLowerCase() === identifier.trim().toLowerCase(),
    );
    if (!found || found.password !== password) {
      throw new Error("INVALID_CREDENTIALS");
    }
    localStorage.setItem(SESSION_KEY, found.id);
    setUser(found);
    return found;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
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
    visibleAccounts,
    requests,
    auditEvents,
    hasModule: (m) =>
      !!user && (user.role === "admin" || user.modules.includes(m)),
    createAccount: async (input) => {
      await wait();
      const created: SipAccount = {
        id: `acc-${Math.random().toString(36).slice(2, 8)}`,
        sipId: input.sipId,
        displayName: input.displayName,
        email: input.email,
        disabled: false,
        expiresAt: new Date(input.expiresAt).toISOString(),
        createdAt: new Date().toISOString(),
        createdById: user?.id ?? "u-admin",
        createdByName: user?.name ?? "Nora Varga",
        notes: input.notes,
      };
      setAccounts((prev) => [created, ...prev]);
      logEvent("sip", "account.created", created.sipId);
      return created;
    },
    renewAccount: async (id, expiresAt) => {
      await wait();
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, expiresAt: new Date(expiresAt).toISOString() }
            : a,
        ),
      );
      const target = accounts.find((a) => a.id === id);
      logEvent(
        "sip",
        "account.renewed",
        target?.sipId ?? id,
        `New expiry ${new Date(expiresAt).toLocaleDateString("en-GB")}`,
      );
    },
    setDisabled: async (id, disabled) => {
      await wait(480);
      setAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, disabled } : a)),
      );
      const target = accounts.find((a) => a.id === id);
      logEvent(
        "sip",
        disabled ? "account.disabled" : "account.enabled",
        target?.sipId ?? id,
      );
    },
    deleteAccount: async (id) => {
      await wait(760);
      const target = accounts.find((a) => a.id === id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      logEvent("sip", "account.deleted", target?.sipId ?? id);
    },
    decideRequest: async (id, status, reason) => {
      await wait(560);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status, decisionReason: reason } : r,
        ),
      );
      const target = requests.find((r) => r.id === id);
      if (target) {
        logEvent(
          target.module,
          status === "approved" ? "request.approved" : "request.rejected",
          target.name,
          reason,
        );
      }
    },
    submitRequest: async (input) => {
      await wait(1100);
      if (input.email.endsWith("@fail.test")) throw new Error("SUBMIT_FAILED");
      setRequests((prev) => [
        {
          ...input,
          id: `req-${Math.random().toString(36).slice(2, 7)}`,
          submittedAt: new Date().toISOString(),
          status: "pending",
        },
        ...prev,
      ]);
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
