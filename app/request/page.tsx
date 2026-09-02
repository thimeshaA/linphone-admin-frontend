import type { Metadata } from "next";
import { RequestClient } from "./request-client";

export const metadata: Metadata = {
  title: "Request access — Admin Control",
  description:
    "Apply to become a SIP reseller. Requests are reviewed by the network operations team.",
  openGraph: {
    title: "Request access — Admin Control",
    description: "Apply for SIP reseller access.",
  },
};

export default function Page() {
  return <RequestClient />;
}
