"use client";

import { AppShell } from "@/components/telephony/app-shell";
import { ResellerWalletDetailView } from "@/components/telephony/reseller-wallet-detail-view";

export function ResellerWalletDetailClient({
  resellerId,
}: {
  resellerId: string;
}) {
  return (
    <AppShell>
      <ResellerWalletDetailView resellerId={resellerId} />
    </AppShell>
  );
}
