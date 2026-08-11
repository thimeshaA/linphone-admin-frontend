"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, PauseCircle, PlayCircle } from "lucide-react";
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
import type { SipAccount } from "@/lib/telephony/types";

const inputClass =
  "h-11 w-full rounded-xl bg-background px-4 text-sm outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring";
const primaryBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-module px-5 text-sm font-semibold text-background transition-transform active:scale-[0.98] disabled:opacity-60";
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

export function CreateAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { createAccount } = useTelephony();
  const [sipId, setSipId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState(
    toDateInput(new Date(Date.now() + 365 * 86_400_000).toISOString()),
  );
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  function reset() {
    setSipId("");
    setDisplayName("");
    setEmail("");
    setNotes("");
    setErrors({});
    setState("idle");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!/^\d{3,6}@[\w.-]+\.[a-z]{2,}$/i.test(sipId.trim()))
      next["sipId"] =
        "Use the form extension@domain, e.g. 4210@sip.flexivoice.net";
    if (!displayName.trim())
      next["displayName"] = "A display name is shown on inbound calls.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      next["email"] = "Enter a contact email for renewal notices.";
    if (new Date(expiresAt).getTime() <= Date.now())
      next["expiresAt"] = "Expiry must be in the future.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setState("loading");
    try {
      const created = await createAccount({
        sipId: sipId.trim(),
        displayName: displayName.trim(),
        email: email.trim(),
        expiresAt,
        notes: notes.trim() || undefined,
      });
      toast.success(`${created.sipId} provisioned`, {
        description: `Active until ${formatDate(created.expiresAt)}.`,
      });
      reset();
      onOpenChange(false);
    } catch {
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
            starts in the active state until the expiry date you set.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="c-sip">SIP identifier</Label>
            <input
              id="c-sip"
              className={inputClass}
              value={sipId}
              onChange={(e) => setSipId(e.target.value)}
              placeholder="4210@sip.flexivoice.net"
              aria-invalid={!!errors["sipId"]}
            />
            {errors["sipId"] ? (
              <p role="alert" className="text-xs text-negative-foreground">
                {errors["sipId"]}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-name">Display name</Label>
              <input
                id="c-name"
                className={inputClass}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                aria-invalid={!!errors["displayName"]}
              />
              {errors["displayName"] ? (
                <p role="alert" className="text-xs text-negative-foreground">
                  {errors["displayName"]}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-email">Contact email</Label>
              <input
                id="c-email"
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors["email"]}
              />
              {errors["email"] ? (
                <p role="alert" className="text-xs text-negative-foreground">
                  {errors["email"]}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-exp">Expiry date</Label>
            <input
              id="c-exp"
              type="date"
              className={inputClass}
              value={expiresAt}
              min={toDateInput(new Date(Date.now() + 86_400_000).toISOString())}
              onChange={(e) => setExpiresAt(e.target.value)}
              aria-invalid={!!errors["expiresAt"]}
            />
            {errors["expiresAt"] ? (
              <p role="alert" className="text-xs text-negative-foreground">
                {errors["expiresAt"]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-notes">Internal notes</Label>
            <textarea
              id="c-notes"
              rows={2}
              className="w-full rounded-xl bg-background p-4 text-sm outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {state === "error" ? (
            <p
              role="alert"
              className="rounded-xl bg-negative-muted px-4 py-3 text-sm text-negative-foreground"
            >
              Provisioning failed on the cluster. Your input is preserved — try
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
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const current = account?.expiresAt ?? new Date().toISOString();
  const value =
    date ||
    toDateInput(
      new Date(new Date(current).getTime() + 365 * 86_400_000).toISOString(),
    );

  return (
    <Dialog
      open={!!account}
      onOpenChange={(v) => {
        if (!v) {
          setDate("");
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
            Choose any expiry date. Renewing an expired account restores it to
            active immediately.
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
            <p className="mt-1.5 text-sm font-semibold text-module">
              {formatDate(new Date(value).toISOString())}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="r-date">New expiry date</Label>
          <input
            id="r-date"
            type="date"
            className={inputClass}
            value={value}
            min={toDateInput(new Date(Date.now() + 86_400_000).toISOString())}
            onChange={(e) => setDate(e.target.value)}
          />
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
              setLoading(true);
              await renewAccount(account.id, value);
              setLoading(false);
              toast.success(`${account.sipId} renewed`, {
                description: `Now valid until ${formatDate(new Date(value).toISOString())}.`,
              });
              setDate("");
              onClose();
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
              await setDisabled(account.id, !account.disabled);
              setLoading(false);
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
              await deleteAccount(account.id);
              setLoading(false);
              toast.success(`${account.sipId} deleted`, {
                description: "The identity has been removed from the cluster.",
              });
              setConfirm("");
              onClose();
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
