"use client";

import { type FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/telephony/app-shell";
import { PageHeader } from "@/components/telephony/primitives";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTelephony } from "@/contexts/telephony-context";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

// Matches the rule already enforced on the reset-password form — see
// app/reset-password/reset-password-client.tsx. No stronger rule exists
// anywhere else in the app, so this is the one to stay consistent with.
const MIN_PASSWORD_LENGTH = 8;

const inputClass =
  "h-11 w-full rounded-xl bg-background pr-11 pl-4 text-sm outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring";
const primaryBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-module px-5 text-sm font-semibold text-ink transition-transform active:scale-[0.98] disabled:opacity-60";
const ghostBtn =
  "inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-5 text-sm font-medium";

export function SettingsClient() {
  return (
    <AppShell>
      <SettingsPage />
    </AppShell>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Platform tools"
        title="Settings"
        description="Manage your account security. Organisation profile, API keys and other platform preferences will live here."
      />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <AccountDetailsCard />
        <PasswordCard />
      </div>
    </div>
  );
}

function AccountDetailsCard() {
  const { user } = useTelephony();
  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const roleLabel =
    user.role === "admin" ? "Administrator" : (user.org ?? "Reseller");

  return (
    <section
      aria-label="Account details"
      className="glass glass-hairline space-y-7 rounded-[20px] p-6 sm:p-7"
    >
      <div className="flex items-center gap-5">
        <span className="module-bg grid size-16 shrink-0 place-items-center rounded-full font-display text-xl font-bold">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-bold tracking-tight">
            {user.name}
          </p>
          <span className="module-tint mt-2 inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[11px] leading-none tracking-wider text-module-strong uppercase">
            {roleLabel}
          </span>
        </div>
      </div>
      <dl className="border-t border-border pt-6">
        <dt className="label-meta">Username</dt>
        <dd className="mt-2 font-mono text-sm break-all">{user.identifier}</dd>
      </dl>
    </section>
  );
}

function PasswordCard() {
  const [open, setOpen] = useState(false);
  return (
    <section
      aria-label="Password"
      className="glass glass-hairline flex h-full flex-col justify-between space-y-7 rounded-[20px] p-6 sm:p-7"
    >
      <div>
        <span className="module-tint grid size-12 shrink-0 place-items-center rounded-2xl">
          <KeyRound aria-hidden="true" className="size-6" />
        </span>
        <h3 className="mt-5 font-display text-xl font-bold tracking-tight">
          Password
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Change the password for your own account. You&apos;ll stay signed in
          on this device — nothing else changes.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="module-bg inline-flex h-11 w-fit items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-transform active:scale-[0.98]"
      >
        Change password
        <ArrowRight aria-hidden="true" className="size-4" />
      </button>
      <ChangePasswordDialog open={open} onOpenChange={setOpen} />
    </section>
  );
}

function PasswordField({
  id,
  label,
  autoComplete,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
}) {
  const [reveal, setReveal] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={reveal ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setReveal((v) => !v)}
          aria-label={reveal ? "Hide password" : "Show password"}
          className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {reveal ? (
            <EyeOff aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-negative-foreground">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirm("");
    setErrors({});
    setLoading(false);
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!currentPassword)
      next["currentPassword"] = "Enter your current password.";
    if (newPassword.length < MIN_PASSWORD_LENGTH)
      next["newPassword"] = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (confirm !== newPassword) next["confirm"] = "Passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success("Password updated", {
        description: "Use your new password next time you sign in.",
      });
      handleClose();
    } catch (err) {
      // The backend rejects a wrong current password with a specific
      // message (rather than a generic 400) — surface it right on the
      // current-password field instead of a detached banner, since that's
      // exactly what's wrong.
      setErrors({
        currentPassword:
          err instanceof ApiError
            ? err.message
            : "Could not update your password. Try again.",
      });
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (!v ? handleClose() : onOpenChange(v))}
    >
      <DialogContent className="rounded-[20px] sm:max-w-md">
        <DialogHeader>
          <span
            aria-hidden="true"
            className="module-tint grid size-10 place-items-center rounded-2xl"
          >
            <KeyRound aria-hidden="true" className="size-5" />
          </span>
          <DialogTitle className="font-display text-xl">
            Change password
          </DialogTitle>
          <DialogDescription>
            Update the password for your own account. You&apos;ll stay signed in
            on this device.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <PasswordField
            id="settings-current-password"
            label="Current password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={setCurrentPassword}
            error={errors["currentPassword"]}
          />
          <PasswordField
            id="settings-new-password"
            label="New password"
            autoComplete="new-password"
            value={newPassword}
            onChange={setNewPassword}
            error={errors["newPassword"]}
          />
          <PasswordField
            id="settings-confirm-password"
            label="Confirm new password"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
            error={errors["confirm"]}
          />

          <DialogFooter className="gap-2 sm:gap-2">
            <button type="button" className={ghostBtn} onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className={primaryBtn} disabled={loading}>
              {loading ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              {loading ? "Updating…" : "Update password"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
