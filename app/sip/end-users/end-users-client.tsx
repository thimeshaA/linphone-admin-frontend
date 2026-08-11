"use client";

import { AppShell } from "@/components/telephony/app-shell";
import { EndUsersView } from "@/components/telephony/end-users-view";

export function SipEndUsersClient() {
  return (
    <AppShell>
      <EndUsersView module="sip" />
    </AppShell>
  );
}
