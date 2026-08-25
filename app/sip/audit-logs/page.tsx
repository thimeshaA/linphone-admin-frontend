import type { Metadata } from "next";
import { SipAuditLogsClient } from "./audit-logs-client";

export const metadata: Metadata = {
  title: "Account audit logs — Admin Control",
  description:
    "Recorded create, renew, disable and delete actions on SIP accounts.",
};

export default function Page() {
  return <SipAuditLogsClient />;
}
