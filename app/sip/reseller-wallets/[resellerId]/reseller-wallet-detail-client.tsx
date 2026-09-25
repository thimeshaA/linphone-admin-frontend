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
      {/* key resets all local state (page numbers included) when navigating
          from one reseller's wallet straight to another's. */}
      <ResellerWalletDetailView key={resellerId} resellerId={resellerId} />
    </AppShell>
  );
}
