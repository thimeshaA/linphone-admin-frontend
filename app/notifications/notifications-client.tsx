"use client";

import { Bell } from "lucide-react";
import { AppShell } from "@/components/telephony/app-shell";
import { ComingSoon } from "@/components/telephony/stub-page";

export function NotificationsClient() {
  return (
    <AppShell>
      <ComingSoon
        eyebrow="Platform tools"
        title="Notifications"
        description="Alerts for expiring accounts, new requests and audit events will surface here."
        icon={<Bell aria-hidden="true" className="size-5" />}
      />
    </AppShell>
  );
}
