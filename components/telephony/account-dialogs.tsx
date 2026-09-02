"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Loader2,
  PauseCircle,
  Plus,
  PlayCircle,
  Trash2,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTelephony } from "@/contexts/telephony-context";
import { formatDate, toDateInput } from "@/lib/telephony/status";
import { addPeriods } from "@/lib/telephony/period";
import type { SipAccount } from "@/lib/telephony/types";
import { PeriodPicker } from "./period-picker";

const SIP_DOMAIN = "test.kryptoline.com";

const inputClass =
  "h-11 w-full rounded-xl bg-background px-4 text-sm outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring";
const primaryBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-module px-5 text-sm font-semibold text-ink transition-transform active:scale-[0.98] disabled:opacity-60";
const ghostBtn =
  "inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-5 text-sm font-medium";
const dangerBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-destructive px-5 text-sm font-semibold text-destructive-foreground transition-transform active:scale-[0.98] disabled:opacity-60";

function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium">
      {children}
    </label>
  );
}

// Shared by the create and reassign dialogs — both need an admin to pick a
// reseller to own the account. Disabled resellers are shown but unselectable
// since the backend rejects assigning accounts to them.
function ResellerSelect({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
}) {
  const { resellers, resellersLoading } = useTelephony();
  return (
    <select
      id={id}
      className={inputClass}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={invalid}
      disabled={resellersLoading}
    >
      <option value="">
        {resellersLoading ? "Loading resellers…" : "Select a reseller"}
      </option>
      {resellers.map((r) => (
        <option key={r.id} value={r.id} disabled={r.status === "disabled"}>
          {r.username}
          {r.status === "disabled" ? " (disabled)" : ""}
        </option>
      ))}
    </select>
  );
}

export function CreateAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { createAccount } = useTelephony();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resellerId, setResellerId] = useState("");
  const [periods, setPeriods] = useState(1); // 1 x 6 months = the base period
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [serverError, setServerError] = useState("");

  function reset() {
    setUsername("");
    setEmail("");
    setPassword("");
    setResellerId("");
    setPeriods(1);
    setErrors({});
    setState("idle");
    setServerError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!/^[\w.-]{1,64}$/.test(username))
      next["username"] =
        "Use letters, numbers, dots, underscores or hyphens only — no spaces.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next["email"] = "Enter a valid email address.";
    if (!password.trim())
      next["password"] = "A password is required to register the identity.";
    if (!resellerId)
      next["reseller"] = "Choose which reseller owns this account.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setState("loading");
    try {
      const expiresAt = toDateInput(
        addPeriods(new Date(), periods).toISOString(),
      );
      const created = await createAccount({
        sipId: `${username}@${SIP_DOMAIN}`,
        email: email.trim(),
        password,
        expiresAt,
        creatorId: resellerId,
      });
      toast.success(`${created.sipId} provisioned`, {
        description: `Active until ${formatDate(created.expiresAt)}.`,
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Provisioning failed.",
      );
      setState("error");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) =>
        v ? onOpenChange(v) : (reset(), onOpenChange(false))
      }
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-[20px] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Provision a SIP account
          </DialogTitle>
          <DialogDescription>
            The identity is registered on the Flexisip cluster immediately and
            starts in the active state. Subscriptions run in fixed 6-month
            periods.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="c-sip">SIP username</Label>
            <input
              id="c-sip"
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
              placeholder="4210"
              aria-invalid={!!errors["username"]}
            />
            {errors["username"] ? (
              <p role="alert" className="text-xs text-negative-foreground">
                {errors["username"]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-email">Email</Label>
            <input
              id="c-email"
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              aria-invalid={!!errors["email"]}
            />
            {errors["email"] ? (
              <p role="alert" className="text-xs text-negative-foreground">
                {errors["email"]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-password">Password</Label>
            <input
              id="c-password"
              type="password"
              autoComplete="new-password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors["password"]}
            />
            {errors["password"] ? (
              <p role="alert" className="text-xs text-negative-foreground">
                {errors["password"]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-reseller">Assign to reseller</Label>
            <ResellerSelect
              id="c-reseller"
              value={resellerId}
              onChange={setResellerId}
              invalid={!!errors["reseller"]}
            />
            {errors["reseller"] ? (
              <p role="alert" className="text-xs text-negative-foreground">
                {errors["reseller"]}
              </p>
            ) : null}
          </div>

          <PeriodPicker
            id="c-exp"
            label="Subscription length"
            baseDate={new Date()}
            periods={periods}
            onChange={setPeriods}
          />

          {state === "error" ? (
            <p
              role="alert"
              className="rounded-xl bg-negative-muted px-4 py-3 text-sm text-negative-foreground"
            >
              {serverError}. Your input is preserved — try again.
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              className={ghostBtn}
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={primaryBtn}
              disabled={state === "loading"}
            >
              {state === "loading" ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              {state === "loading" ? "Provisioning…" : "Provision account"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RenewDialog({
  account,
  onClose,
}: {
  account: SipAccount | null;
  onClose: () => void;
}) {
  const { renewAccount } = useTelephony();
  const [periods, setPeriods] = useState(1); // 1 x 6 months = the base period
  const [loading, setLoading] = useState(false);
  const base = new Date(account?.expiresAt ?? new Date().toISOString());
  const newExpiry = addPeriods(base, periods);
  const value = toDateInput(newExpiry.toISOString());

  return (
    <Dialog
      open={!!account}
      onOpenChange={(v) => {
        if (!v) {
          setPeriods(1);
          onClose();
        }
      }}
    >
      <DialogContent className="rounded-[20px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Renew account
          </DialogTitle>
          <DialogDescription>
            Renews in fixed 6-month periods. Renewing an expired account
            restores it to active immediately.
          </DialogDescription>
        </DialogHeader>

        <p className="font-mono text-sm break-all">{account?.sipId}</p>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl bg-background p-4">
          <div>
            <p className="label-meta">Current expiry</p>
            <p className="mt-1.5 text-sm">
              {account ? formatDate(account.expiresAt) : "—"}
            </p>
          </div>
          <span aria-hidden="true" className="text-muted-foreground">
            →
          </span>
          <div>
            <p className="label-meta">New expiry</p>
            <p className="mt-1.5 text-sm font-semibold text-module-strong">
              {formatDate(newExpiry.toISOString())}
            </p>
          </div>
        </div>

        <PeriodPicker
          id="r-date"
          label="Extend by"
          baseDate={base}
          periods={periods}
          onChange={setPeriods}
        />

        <DialogFooter className="gap-2 sm:gap-2">
          <button type="button" className={ghostBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryBtn}
            disabled={loading}
            onClick={async () => {
              if (!account) return;
              setLoading(true);
              try {
                await renewAccount(account.id, value);
                toast.success(`${account.sipId} renewed`, {
                  description: `Now valid until ${formatDate(newExpiry.toISOString())}.`,
                });
                setPeriods(1);
                onClose();
              } catch {
                toast.error("Renewal failed", {
                  description: "The backend rejected the request. Try again.",
                });
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            {loading ? "Applying…" : "Confirm renewal"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DisableDialog({
  account,
  onClose,
}: {
  account: SipAccount | null;
  onClose: () => void;
}) {
  const { setDisabled } = useTelephony();
  const [loading, setLoading] = useState(false);
  const enabling = account?.disabled === true;

  return (
    <Dialog open={!!account} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="rounded-[20px] sm:max-w-md">
        <DialogHeader>
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-2xl bg-neutral-pill text-muted-foreground"
          >
            {enabling ? (
              <PlayCircle className="size-5" />
            ) : (
              <PauseCircle className="size-5" />
            )}
          </span>
          <DialogTitle className="font-display text-xl">
            {enabling ? "Re-enable this account?" : "Disable this account?"}
          </DialogTitle>
          <DialogDescription>
            {enabling
              ? "Registration is restored and the account resumes its existing expiry date. Nothing else changes."
              : "The account stays in the system with all its data and history — it simply stops registering and cannot place or receive calls. You can re-enable it at any time. This is not a deletion."}
          </DialogDescription>
        </DialogHeader>

        <p className="font-mono text-sm break-all">{account?.sipId}</p>

        <DialogFooter className="gap-2 sm:gap-2">
          <button type="button" className={ghostBtn} onClick={onClose}>
            Keep as is
          </button>
          <button
            type="button"
            className={primaryBtn}
            disabled={loading}
            onClick={async () => {
              if (!account) return;
              setLoading(true);
              try {
                await setDisabled(account.id, !account.disabled);
                toast.success(
                  enabling
                    ? `${account.sipId} re-enabled`
                    : `${account.sipId} disabled`,
                  {
                    description: enabling
                      ? "The account is registering again."
                      : "The account remains in the system, inactive.",
                  },
                );
                onClose();
              } catch {
                toast.error(enabling ? "Re-enable failed" : "Disable failed", {
                  description: "The backend rejected the request. Try again.",
                });
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            {enabling ? "Re-enable account" : "Disable account"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReassignDialog({
  account,
  onClose,
}: {
  account: SipAccount | null;
  onClose: () => void;
}) {
  const { reassignAccount } = useTelephony();
  const [resellerId, setResellerId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <Dialog
      open={!!account}
      onOpenChange={(v) => {
        if (!v) {
          setResellerId("");
          setError("");
          onClose();
        }
      }}
    >
      <DialogContent className="rounded-[20px] sm:max-w-md">
        <DialogHeader>
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-2xl bg-neutral-pill text-muted-foreground"
          >
            <UserCog className="size-5" />
          </span>
          <DialogTitle className="font-display text-xl">
            Reassign account
          </DialogTitle>
          <DialogDescription>
            Moves this account to a different reseller. It will stop appearing
            under the current owner and start appearing under the new one.
          </DialogDescription>
        </DialogHeader>

        <p className="font-mono text-sm break-all">{account?.sipId}</p>

        <div className="space-y-2">
          <Label htmlFor="rs-reseller">
            Currently: {account?.createdByName || "Unassigned"}
          </Label>
          <ResellerSelect
            id="rs-reseller"
            value={resellerId}
            onChange={setResellerId}
            invalid={!!error}
          />
          {error ? (
            <p role="alert" className="text-xs text-negative-foreground">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button type="button" className={ghostBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryBtn}
            disabled={loading}
            onClick={async () => {
              if (!account) return;
              if (!resellerId) {
                setError("Choose the reseller to reassign this account to.");
                return;
              }
              setLoading(true);
              try {
                await reassignAccount(account.id, resellerId);
                toast.success(`${account.sipId} reassigned`, {
                  description: "The account now belongs to the new reseller.",
                });
                setResellerId("");
                onClose();
              } catch {
                toast.error("Reassign failed", {
                  description: "The backend rejected the request. Try again.",
                });
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            {loading ? "Reassigning…" : "Confirm reassign"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteDialog({
  account,
  onClose,
}: {
  account: SipAccount | null;
  onClose: () => void;
}) {
  const { deleteAccount } = useTelephony();
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const matches = account ? confirm.trim() === account.sipId : false;

  return (
    <Dialog
      open={!!account}
      onOpenChange={(v) => {
        if (!v) {
          setConfirm("");
          onClose();
        }
      }}
    >
      <DialogContent className="rounded-[20px] sm:max-w-md">
        <DialogHeader>
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-2xl bg-negative-muted text-negative-foreground"
          >
            <AlertTriangle className="size-5" />
          </span>
          <DialogTitle className="font-display text-xl text-negative-foreground">
            Permanently delete this account
          </DialogTitle>
          <DialogDescription>
            This erases the SIP identity, its registration and its provisioning
            history from the cluster. It cannot be undone and cannot be
            recovered. If you only want to pause service, disable the account
            instead.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="d-confirm">
            Type{" "}
            <span className="font-mono text-foreground">{account?.sipId}</span>{" "}
            to confirm
          </Label>
          <input
            id="d-confirm"
            className={inputClass}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="off"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            className={ghostBtn}
            onClick={() => {
              setConfirm("");
              onClose();
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className={dangerBtn}
            disabled={!matches || loading}
            onClick={async () => {
              if (!account) return;
              setLoading(true);
              try {
                await deleteAccount(account.id);
                toast.success(`${account.sipId} deleted`, {
                  description:
                    "The identity has been removed from the cluster.",
                });
                setConfirm("");
                onClose();
              } catch {
                toast.error("Delete failed", {
                  description: "The backend rejected the request. Try again.",
                });
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            {loading ? "Deleting…" : "Delete permanently"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RequestRow {
  key: string;
  name: string;
  email: string;
  phone: string;
  note: string;
}

function newRequestRow(): RequestRow {
  return {
    key: `row-${Math.random().toString(36).slice(2, 9)}`,
    name: "",
    email: "",
    phone: "",
    note: "",
  };
}

export function RequestAccountsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { submitAccountRequests } = useTelephony();
  const [rows, setRows] = useState<RequestRow[]>([newRequestRow()]);
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>(
    {},
  );
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [serverError, setServerError] = useState("");

  function reset() {
    setRows([newRequestRow()]);
    setErrors({});
    setState("idle");
    setServerError("");
  }

  function updateRow(
    key: string,
    field: "name" | "email" | "phone" | "note",
    value: string,
  ) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, newRequestRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.key !== key) : prev,
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, Record<string, string>> = {};
    for (const row of rows) {
      const rowErrors: Record<string, string> = {};
      const email = row.email.trim();
      const phone = row.phone.trim();
      if (!row.name.trim()) rowErrors["name"] = "Enter a name.";
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        rowErrors["email"] = "Enter a valid email address.";
      if (!email && !phone)
        rowErrors["contact"] = "Enter an email address or a phone number.";
      if (Object.keys(rowErrors).length) nextErrors[row.key] = rowErrors;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setState("loading");
    try {
      await submitAccountRequests(
        rows.map((r) => ({
          name: r.name.trim(),
          email: r.email.trim() || undefined,
          phone: r.phone.trim() || undefined,
          note: r.note.trim() || undefined,
        })),
      );
      toast.success(
        rows.length === 1
          ? "Account request sent"
          : `${rows.length} account requests sent`,
        { description: "Our operations team will follow up by email." },
      );
      reset();
      onOpenChange(false);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "The request failed to send.",
      );
      setState("error");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) =>
        v ? onOpenChange(v) : (reset(), onOpenChange(false))
      }
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-[20px] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Request account(s)
          </DialogTitle>
          <DialogDescription>
            Nothing is provisioned automatically — this sends your request to
            our operations team, who will follow up by email. Add as many
            entries as you need and send them in one submission.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-4">
            {rows.map((row, i) => (
              <div
                key={row.key}
                className="space-y-3 rounded-xl bg-background p-4 ring-1 ring-input"
              >
                <div className="flex items-center justify-between">
                  <p className="label-meta">Entry {i + 1}</p>
                  {rows.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-negative-foreground"
                      aria-label={`Remove entry ${i + 1}`}
                    >
                      <Trash2 aria-hidden="true" className="size-3.5" />
                      Remove
                    </button>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`req-name-${row.key}`}>Name</Label>
                  <input
                    id={`req-name-${row.key}`}
                    className={inputClass}
                    value={row.name}
                    onChange={(e) => updateRow(row.key, "name", e.target.value)}
                    aria-invalid={!!errors[row.key]?.["name"]}
                  />
                  {errors[row.key]?.["name"] ? (
                    <p
                      role="alert"
                      className="text-xs text-negative-foreground"
                    >
                      {errors[row.key]?.["name"]}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`req-email-${row.key}`}>Email</Label>
                    <input
                      id={`req-email-${row.key}`}
                      type="email"
                      className={inputClass}
                      value={row.email}
                      onChange={(e) =>
                        updateRow(row.key, "email", e.target.value)
                      }
                      aria-invalid={!!errors[row.key]?.["email"]}
                    />
                    {errors[row.key]?.["email"] ? (
                      <p
                        role="alert"
                        className="text-xs text-negative-foreground"
                      >
                        {errors[row.key]?.["email"]}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`req-phone-${row.key}`}>Phone</Label>
                    <input
                      id={`req-phone-${row.key}`}
                      type="tel"
                      className={inputClass}
                      value={row.phone}
                      onChange={(e) =>
                        updateRow(row.key, "phone", e.target.value)
                      }
                      aria-invalid={!!errors[row.key]?.["contact"]}
                    />
                  </div>
                </div>
                {errors[row.key]?.["contact"] ? (
                  <p role="alert" className="text-xs text-negative-foreground">
                    {errors[row.key]?.["contact"]}
                  </p>
                ) : null}

                <div className="space-y-1.5">
                  <Label htmlFor={`req-note-${row.key}`}>Note</Label>
                  <input
                    id={`req-note-${row.key}`}
                    className={inputClass}
                    value={row.note}
                    onChange={(e) => updateRow(row.key, "note", e.target.value)}
                    placeholder="Optional — anything that helps us provision this account"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-secondary px-4 text-sm font-medium"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add another account
          </button>

          {state === "error" ? (
            <p
              role="alert"
              className="rounded-xl bg-negative-muted px-4 py-3 text-sm text-negative-foreground"
            >
              {serverError}. Nothing was sent — your entries are preserved, try
              again.
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              className={ghostBtn}
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={primaryBtn}
              disabled={state === "loading"}
            >
              {state === "loading" ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              {state === "loading"
                ? "Sending…"
                : rows.length === 1
                  ? "Send request"
                  : `Send ${rows.length} requests`}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
