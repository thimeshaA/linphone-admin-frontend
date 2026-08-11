import type { Metadata } from "next";
import { RequestClient } from "./request-client";

export const metadata: Metadata = {
  title: "Request access — Admin Control",
  description:
    "Apply to become a SIP or eSIM reseller, or request a telephony account. Requests are reviewed by the network operations team.",
  openGraph: {
    title: "Request access — Admin Control",
    description: "Apply for reseller access or request a SIP or eSIM account.",
  },
};

export default function Page() {
  return <RequestClient />;
}
