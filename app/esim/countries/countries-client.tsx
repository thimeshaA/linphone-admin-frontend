"use client";

import { Globe2 } from "lucide-react";
import { AppShell } from "@/components/telephony/app-shell";
import { ComingSoon } from "@/components/telephony/stub-page";

export function EsimCountriesClient() {
  return (
    <AppShell>
      <ComingSoon
        module="esim"
        eyebrow="Coverage"
        title="Countries"
        description="Per-country eSIM coverage and pricing will live here once profile inventory ships."
        icon={<Globe2 aria-hidden="true" className="size-5" />}
        bullets={[
          "Coverage map by country and network",
          "Per-country data plan pricing",
          "Local regulatory / KYC requirements",
        ]}
      />
    </AppShell>
  );
}
