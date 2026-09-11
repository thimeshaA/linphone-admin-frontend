import type { Metadata } from "next";
import { ResellerWalletsClient } from "./reseller-wallets-client";

export const metadata: Metadata = {
  title: "Wallets — Admin Control",
  description: "Balances and payment status across every reseller.",
};

export default function Page() {
  return <ResellerWalletsClient />;
}
