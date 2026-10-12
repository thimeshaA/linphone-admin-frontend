"use client";

import { QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const primaryBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-module px-5 text-sm font-semibold text-ink transition-transform active:scale-[0.98] disabled:opacity-60";

/**
 * Shown once, right after a SIP account is created or its password is
 * changed. `qrPayload` is an opaque, backend-encrypted string — this
 * component only draws it as a QR code and never inspects, logs, or persists
 * it anywhere beyond the caller's own state.
 */
export function AccountQrDialog({
  authid,
  qrPayload,
  onClose,
}: {
  authid: string | null;
  qrPayload: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!qrPayload}
      onOpenChange={(v) => (!v ? onClose() : undefined)}
    >
      <DialogContent className="rounded-[20px] sm:max-w-sm">
        <DialogHeader>
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-2xl bg-neutral-pill text-muted-foreground"
          >
            <QrCode className="size-5" />
          </span>
          <DialogTitle className="font-display text-xl">
            Scan to sign in
          </DialogTitle>
          <DialogDescription>
            Scan this QR code in the app to sign in. It is shown once. Closing
            this window discards it.
          </DialogDescription>
        </DialogHeader>

        {authid ? (
          <p className="text-center font-mono text-sm break-all text-muted-foreground">
            {authid}
          </p>
        ) : null}

        {qrPayload ? (
          <div className="flex justify-center py-2">
            <div className="rounded-xl bg-white p-4">
              <QRCodeSVG
                value={qrPayload}
                size={280}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#000000"
                marginSize={4}
                className="h-auto max-w-full"
              />
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <button type="button" className={primaryBtn} onClick={onClose}>
            Done
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
