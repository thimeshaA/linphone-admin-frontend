"use client";

import { AppShell } from "@/components/telephony/app-shell";
import { ResellerWalletsView } from "@/components/telephony/reseller-wallets-view";

export function ResellerWalletsClient() {
  return (
    <AppShell>
      <ResellerWalletsView />
    </AppShell>
  );
}
