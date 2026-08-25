"use client";

import { AppShell } from "@/components/telephony/app-shell";
import { AuditLogView } from "@/components/telephony/audit-log-view";

export function ResellerAuditLogsClient() {
  return (
    <AppShell>
      <AuditLogView module="sip" scope="reseller" />
    </AppShell>
  );
}
