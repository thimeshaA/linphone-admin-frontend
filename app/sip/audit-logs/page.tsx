import type { Metadata } from "next";
import { SipAuditLogsClient } from "./audit-logs-client";

export const metadata: Metadata = {
  title: "SIP audit logs — Admin Control",
  description: "Recorded actions on SIP accounts and requests.",
};

export default function Page() {
  return <SipAuditLogsClient />;
}
