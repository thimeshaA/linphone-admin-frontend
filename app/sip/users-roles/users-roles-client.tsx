"use client";

import { AppShell } from "@/components/telephony/app-shell";
import { UsersRolesView } from "@/components/telephony/users-roles-view";

export function SipUsersRolesClient() {
  return (
    <AppShell>
      <UsersRolesView module="sip" />
    </AppShell>
  );
}
