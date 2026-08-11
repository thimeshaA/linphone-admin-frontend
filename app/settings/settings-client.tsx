"use client";

import { Settings as SettingsIcon } from "lucide-react";
import { AppShell } from "@/components/telephony/app-shell";
import { ComingSoon } from "@/components/telephony/stub-page";

export function SettingsClient() {
  return (
    <AppShell>
      <ComingSoon
        eyebrow="Platform tools"
        title="Settings"
        description="Organisation profile, API keys and platform preferences will live here. Theme and account controls remain available from the sidebar footer for now."
        icon={<SettingsIcon aria-hidden="true" className="size-5" />}
      />
    </AppShell>
  );
}
