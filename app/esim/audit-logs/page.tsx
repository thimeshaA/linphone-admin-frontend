import type { Metadata } from "next";
import { EsimAuditLogsClient } from "./audit-logs-client";

export const metadata: Metadata = {
  title: "eSIM audit logs — Admin Control",
  description: "Recorded actions on eSIM profiles and requests.",
};

export default function Page() {
  return <EsimAuditLogsClient />;
}
