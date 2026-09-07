"use client";

import { Users } from "lucide-react";
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
      icon={<Users aria-hidden="true" className="size-6" />}
      highlights={[
        "New reseller signups added this period",
        "Renewals and upcoming expiries across your network",
        "Account creation activity broken down by reseller",
        "Status changes — disables, re-enables and password resets",
      ]}
    />
  );
}
