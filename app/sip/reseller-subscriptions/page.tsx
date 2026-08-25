import type { Metadata } from "next";
import { ResellerSubscriptionsClient } from "./reseller-subscriptions-client";

export const metadata: Metadata = {
  title: "Reseller subscriptions — Admin Control",
  description: "Renewal and expiry management for reseller logins.",
};

export default function Page() {
  return <ResellerSubscriptionsClient />;
}
