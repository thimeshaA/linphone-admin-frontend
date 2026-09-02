import type { Metadata } from "next";
import { SipReportsClient } from "./reports-client";

export const metadata: Metadata = {
  title: "Account reports — Admin Control",
  description: "Growth, renewal and usage reporting for SIP accounts.",
};

export default function Page() {
  return <SipReportsClient />;
}
