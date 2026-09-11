"use client";

import { AppShell } from "@/components/telephony/app-shell";
import { NotificationsView } from "@/components/telephony/notifications-view";

export function NotificationsClient() {
  return (
    <AppShell>
      <NotificationsView />
    </AppShell>
  );
}
