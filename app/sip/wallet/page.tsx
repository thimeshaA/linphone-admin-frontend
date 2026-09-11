import type { Metadata } from "next";
import { SipWalletClient } from "./wallet-client";

export const metadata: Metadata = {
  title: "Wallet — Admin Control",
  description: "Balance and ledger history for your reseller wallet.",
};

export default function Page() {
  return <SipWalletClient />;
}
