"use client";

import { useState } from "react";
import { KeyRound, Loader2, PauseCircle, PlayCircle } from "lucide-react";
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
import type { Reseller } from "@/lib/telephony/types";
import { PeriodPicker } from "./period-picker";

const inputClass =
  "h-11 w-full rounded-xl bg-background px-4 text-sm outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring";
const primaryBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-module px-5 text-sm font-semibold text-ink transition-transform active:scale-[0.98] disabled:opacity-60";
const ghostBtn =
  "inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-5 text-sm font-medium";

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

export function CreateResellerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { createReseller } = useTelephony();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [periods, setPeriods] = useState(1); // 1 x 6 months = the base period
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [serverError, setServerError] = useState("");

  function reset() {
    setUsername("");
    setEmail("");
    setPassword("");
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
      next["password"] = "A password is required for the reseller login.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setState("loading");
    try {
      const expiresAt = toDateInput(
        addPeriods(new Date(), periods).toISOString(),
      );
      const created = await createReseller({
        username: username.trim(),
        email: email.trim(),
        password,
        expiresAt,
      });
      toast.success(`${created.username} added as a reseller`, {
        description: `Active until ${formatDate(created.expiresAt ?? expiresAt)}.`,
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Could not create the reseller.",
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
      <DialogContent className="rounded-[20px] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Add a reseller
          </DialogTitle>
          <DialogDescription>
            The reseller gets an active login immediately with the username,
            email and password you set below. Subscriptions run in fixed 6-month
            periods.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="rc-username">Username</Label>
            <input
              id="rc-username"
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
              placeholder="d.moreau"
              aria-invalid={!!errors["username"]}
            />
            {errors["username"] ? (
              <p role="alert" className="text-xs text-negative-foreground">
                {errors["username"]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rc-email">Email</Label>
            <input
              id="rc-email"
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="d.moreau@lineabridge.fr"
              aria-invalid={!!errors["email"]}
            />
            {errors["email"] ? (
              <p role="alert" className="text-xs text-negative-foreground">
                {errors["email"]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rc-password">Password</Label>
            <input
              id="rc-password"
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

          <PeriodPicker
            id="rc-exp"
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
              {state === "loading" ? "Adding…" : "Add reseller"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RenewResellerDialog({
  reseller,
  onClose,
}: {
  reseller: Reseller | null;
  onClose: () => void;
}) {
  const { renewReseller } = useTelephony();
  const [periods, setPeriods] = useState(1); // 1 x 6 months = the base period
  const [loading, setLoading] = useState(false);
  const base = new Date(reseller?.expiresAt ?? new Date().toISOString());
  const newExpiry = addPeriods(base, periods);
  const value = toDateInput(newExpiry.toISOString());

  return (
    <Dialog
      open={!!reseller}
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
            Renew reseller
          </DialogTitle>
          <DialogDescription>
            Renews in fixed 6-month periods. Renewing an expired or disabled
            reseller restores it to active immediately.
          </DialogDescription>
        </DialogHeader>

        <p className="font-mono text-sm break-all">{reseller?.username}</p>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl bg-background p-4">
          <div>
            <p className="label-meta">Current expiry</p>
            <p className="mt-1.5 text-sm">
              {reseller?.expiresAt ? formatDate(reseller.expiresAt) : "—"}
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
          id="rr-date"
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
              if (!reseller) return;
              setLoading(true);
              try {
                await renewReseller(reseller.id, value);
                toast.success(`${reseller.username} renewed`, {
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

export function ResetResellerPasswordDialog({
  reseller,
  onClose,
}: {
  reseller: Reseller | null;
  onClose: () => void;
}) {
  const { resetResellerPassword } = useTelephony();
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleClose() {
    setNewPassword("");
    setError("");
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reseller) return;
    if (!newPassword.trim()) {
      setError("Enter a new password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetResellerPassword(reseller.id, newPassword);
      toast.success(`Password reset for ${reseller.username}`);
      handleClose();
    } catch {
      toast.error("Reset failed", {
        description: "The backend rejected the request. Try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={!!reseller}
      onOpenChange={(v) => (!v ? handleClose() : undefined)}
    >
      <DialogContent className="rounded-[20px] sm:max-w-md">
        <DialogHeader>
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-2xl bg-neutral-pill text-muted-foreground"
          >
            <KeyRound className="size-5" />
          </span>
          <DialogTitle className="font-display text-xl">
            Reset password
          </DialogTitle>
          <DialogDescription>
            Set a new password for this reseller&apos;s login. They&apos;ll need
            to use it the next time they sign in.
          </DialogDescription>
        </DialogHeader>

        <p className="font-mono text-sm break-all">{reseller?.username}</p>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="rp-password">New password</Label>
            <input
              id="rp-password"
              type="password"
              autoComplete="new-password"
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              aria-invalid={!!error}
            />
            {error ? (
              <p role="alert" className="text-xs text-negative-foreground">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <button type="button" className={ghostBtn} onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className={primaryBtn} disabled={loading}>
              {loading ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              {loading ? "Saving…" : "Reset password"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DisableResellerDialog({
  reseller,
  onClose,
}: {
  reseller: Reseller | null;
  onClose: () => void;
}) {
  const { setResellerStatus } = useTelephony();
  const [loading, setLoading] = useState(false);
  const enabling = reseller?.status === "disabled";

  return (
    <Dialog
      open={!!reseller}
      onOpenChange={(v) => (!v ? onClose() : undefined)}
    >
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
            {enabling ? "Reactivate this reseller?" : "Disable this reseller?"}
          </DialogTitle>
          <DialogDescription>
            {enabling
              ? "The reseller regains its login and can resume creating and managing accounts immediately."
              : "The reseller stays in the system with all its data and history — it simply loses its login and cannot create or manage accounts. You can reactivate it at any time. This is not a deletion."}
          </DialogDescription>
        </DialogHeader>

        <p className="font-mono text-sm break-all">{reseller?.username}</p>
        {reseller ? (
          <p className="text-xs text-muted-foreground">
            Reseller since {formatDate(reseller.createdAt)}
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-2">
          <button type="button" className={ghostBtn} onClick={onClose}>
            Keep as is
          </button>
          <button
            type="button"
            className={primaryBtn}
            disabled={loading}
            onClick={async () => {
              if (!reseller) return;
              setLoading(true);
              try {
                await setResellerStatus(
                  reseller.id,
                  enabling ? "active" : "disabled",
                );
                toast.success(
                  enabling
                    ? `${reseller.username} reactivated`
                    : `${reseller.username} disabled`,
                  {
                    description: enabling
                      ? "The reseller can sign in again."
                      : "The reseller's login is suspended.",
                  },
                );
                onClose();
              } catch {
                toast.error(enabling ? "Reactivate failed" : "Disable failed", {
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
            {enabling ? "Reactivate reseller" : "Disable reseller"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
