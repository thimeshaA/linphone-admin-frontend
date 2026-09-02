"use client";

import { AppShell } from "@/components/telephony/app-shell";
import { EmptyState } from "@/components/telephony/primitives";
import { ReportGenerator } from "@/components/telephony/report-generator";
import { useTelephony } from "@/contexts/telephony-context";
import { reportsApi } from "@/lib/api/reports";

export function ResellerReportsClient() {
  return (
    <AppShell>
      <ResellerReportsPage />
    </AppShell>
  );
}

function ResellerReportsPage() {
  const { user } = useTelephony();

  if (user?.role !== "admin") {
    return (
      <EmptyState
        title="Administrators only"
        description="Reseller reports are restricted to platform administrators."
      />
    );
  }

  return (
    <ReportGenerator
      eyebrow="Reseller management"
      title="Reseller reports"
      description="Growth, renewal and activity reporting across your reseller network."
      filenamePrefix="reseller-report"
      generate={reportsApi.resellers}
    />
  );
}
