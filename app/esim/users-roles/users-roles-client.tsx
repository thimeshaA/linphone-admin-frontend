"use client";

import { AppShell } from "@/components/telephony/app-shell";
import { UsersRolesView } from "@/components/telephony/users-roles-view";

export function EsimUsersRolesClient() {
  return (
    <AppShell>
      <UsersRolesView module="esim" />
    </AppShell>
  );
}
