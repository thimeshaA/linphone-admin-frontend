import type { Metadata } from "next";
import { ResellerAuditLogsClient } from "./reseller-audit-logs-client";

export const metadata: Metadata = {
  title: "Reseller audit logs — Admin Control",
  description:
    "Recorded create, renew, disable and password actions on reseller logins.",
};

export default function Page() {
  return <ResellerAuditLogsClient />;
}
