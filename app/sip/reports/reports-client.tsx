"use client";

import { AppShell } from "@/components/telephony/app-shell";
import { EmptyState } from "@/components/telephony/primitives";
import { ReportGenerator } from "@/components/telephony/report-generator";
import { useTelephony } from "@/contexts/telephony-context";
import { reportsApi } from "@/lib/api/reports";

export function SipReportsClient() {
  return (
    <AppShell>
      <SipReportsPage />
    </AppShell>
  );
}

function SipReportsPage() {
  const { user, hasModule } = useTelephony();

  if (!hasModule("sip")) {
    return (
      <EmptyState
        title="SIP module not enabled"
        description="Your organisation is not approved for SIP provisioning. Request access from the Admin Contol Panel."
      />
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <ReportGenerator
      eyebrow="Account management"
      title="Account reports"
      description="Growth, renewal and usage reporting for SIP accounts."
      scopeNote={
        isAdmin
          ? "Reports cover every account on the cluster, across all resellers."
          : "Reports are scoped to the accounts your organisation created."
      }
      filenamePrefix="account-report"
      generate={reportsApi.accounts}
    />
  );
}
