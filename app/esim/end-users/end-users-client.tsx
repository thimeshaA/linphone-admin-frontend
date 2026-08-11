"use client";

import { AppShell } from "@/components/telephony/app-shell";
import { EndUsersView } from "@/components/telephony/end-users-view";

export function EsimEndUsersClient() {
  return (
    <AppShell>
      <EndUsersView module="esim" />
    </AppShell>
  );
}
