"use client";

import { CreditCard } from "lucide-react";
import { AppShell } from "@/components/telephony/app-shell";
import { ComingSoon } from "@/components/telephony/stub-page";

export function EsimSubscriptionsClient() {
  return (
    <AppShell>
      <ComingSoon
        module="esim"
        eyebrow="Billing"
        title="Subscriptions"
        description="Renewal and expiry management for eSIM profiles, mirroring the SIP subscriptions view."
        icon={<CreditCard aria-hidden="true" className="size-5" />}
      />
    </AppShell>
  );
}
