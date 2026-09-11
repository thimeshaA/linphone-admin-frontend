"use client";

import { AppShell } from "@/components/telephony/app-shell";
import { WalletView } from "@/components/telephony/wallet-view";

export function SipWalletClient() {
  return (
    <AppShell>
      <WalletView />
    </AppShell>
  );
}
