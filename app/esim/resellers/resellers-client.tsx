"use client";

import { AppShell } from "@/components/telephony/app-shell";
import { ResellersView } from "@/components/telephony/resellers-view";

export function EsimResellersClient() {
  return (
    <AppShell>
      <ResellersView module="esim" />
    </AppShell>
  );
}
