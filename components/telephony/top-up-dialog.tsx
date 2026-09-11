"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";
import { walletApi } from "@/lib/api/wallet";
import type { Reseller } from "@/lib/telephony/types";
import { cn } from "@/lib/utils";
import { formatUsd } from "./wallet-balance";

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

/** Admin-only. Shared by the Wallets list (inline per-row action) and the
 * wallet detail page — the one and only top-up entry point. */
export function TopUpWalletDialog({
  open,
  reseller,
  currentBalance,
  onClose,
  onSuccess,
}: {
  open: boolean;
  reseller: Reseller | null;
  currentBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const parsedAmount = Number(amount);
  const validAmount =
    amount.trim() !== "" && Number.isFinite(parsedAmount) && parsedAmount > 0;
  const newBalance = currentBalance + (validAmount ? parsedAmount : 0);

  function reset() {
    setAmount("");
    setNote("");
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reseller) return;
    if (!validAmount) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await walletApi.topup(reseller.id, {
        amount: parsedAmount,
        note: note.trim() || undefined,
      });
      toast.success(`${reseller.username}'s wallet topped up`, {
        description: `Added ${formatUsd(parsedAmount)} — new balance ${formatUsd(newBalance)}.`,
      });
      reset();
      onSuccess();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not top up the wallet.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : undefined)}>
      <DialogContent className="rounded-[20px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Top up wallet
          </DialogTitle>
          <DialogDescription>
            Adds funds to {reseller?.username}&apos;s wallet balance
            immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl bg-background p-4">
          <div>
            <p className="label-meta">Current balance</p>
            <p className="mt-1.5 text-sm">{formatUsd(currentBalance)}</p>
          </div>
          <span aria-hidden="true" className="text-muted-foreground">
            →
          </span>
          <div>
            <p className="label-meta">New balance</p>
            <p className="mt-1.5 text-sm font-semibold text-module-strong">
              {formatUsd(newBalance)}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="tu-amount">Amount</Label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              >
                $
              </span>
              <input
                id="tu-amount"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                className={cn(inputClass, "pl-7")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                aria-invalid={!!error}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tu-note">Note (optional)</Label>
            <input
              id="tu-note"
              className={inputClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Bank transfer #4821"
            />
          </div>

          {error ? (
            <p role="alert" className="text-xs text-negative-foreground">
              {error}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-2">
            <button type="button" className={ghostBtn} onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className={primaryBtn} disabled={loading}>
              {loading ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              {loading ? "Adding…" : "Confirm top-up"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
