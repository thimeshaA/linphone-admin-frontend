"use client";

import { ChartNoAxesCombined } from "lucide-react";
import { AppShell } from "@/components/telephony/app-shell";
import { ComingSoon } from "@/components/telephony/stub-page";

export function ReportsClient() {
  return (
    <AppShell>
      <ComingSoon
        eyebrow="Platform tools"
        title="Reports"
        description="Cross-module reporting on account growth, renewals and reseller activity."
        icon={<ChartNoAxesCombined aria-hidden="true" className="size-5" />}
      />
    </AppShell>
  );
}
