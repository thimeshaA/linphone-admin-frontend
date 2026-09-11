import type { Metadata } from "next";
import { ResellerInvoicesClient } from "./reseller-invoices-client";

export const metadata: Metadata = {
  title: "Invoices — Admin Control",
  description:
    "Generate, send and track invoices for reseller renewal charges.",
};

export default function Page() {
  return <ResellerInvoicesClient />;
}
