import type { Metadata } from "next";
import { EsimSubscriptionsClient } from "./subscriptions-client";

export const metadata: Metadata = {
  title: "eSIM subscriptions — Admin Control",
  description: "Renewal and expiry management for eSIM profiles.",
};

export default function Page() {
  return <EsimSubscriptionsClient />;
}
