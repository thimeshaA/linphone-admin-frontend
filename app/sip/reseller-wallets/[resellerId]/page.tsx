import type { Metadata } from "next";
import { ResellerWalletDetailClient } from "./reseller-wallet-detail-client";

export const metadata: Metadata = {
  title: "Reseller wallet — Admin Control",
  description: "Balance, ledger history and invoices for a single reseller.",
};

export default async function Page({
  params,
}: {
  params: Promise<{ resellerId: string }>;
}) {
  const { resellerId } = await params;
  return <ResellerWalletDetailClient resellerId={resellerId} />;
}
