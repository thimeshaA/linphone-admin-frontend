"use client";

import { AppShell } from "@/components/telephony/app-shell";
import { InvoicesView } from "@/components/telephony/invoices-view";

export function ResellerInvoicesClient() {
  return (
    <AppShell>
      <InvoicesView />
    </AppShell>
  );
}
