import type { Metadata } from "next";
import { SipSubscriptionsClient } from "./subscriptions-client";

export const metadata: Metadata = {
  title: "SIP subscriptions — Admin Control",
  description: "Renewal and expiry management for SIP accounts.",
};

export default function Page() {
  return <SipSubscriptionsClient />;
}
