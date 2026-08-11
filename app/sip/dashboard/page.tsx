import type { Metadata } from "next";
import { SipDashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "SIP dashboard — Admin Control",
  description: "Registration health across SIP accounts on the cluster.",
};

export default function Page() {
  return <SipDashboardClient />;
}
