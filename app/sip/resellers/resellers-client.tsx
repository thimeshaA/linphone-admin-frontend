"use client";

import { AppShell } from "@/components/telephony/app-shell";
import { ResellersView } from "@/components/telephony/resellers-view";

export function SipResellersClient() {
  return (
    <AppShell>
      <ResellersView module="sip" />
    </AppShell>
  );
}
