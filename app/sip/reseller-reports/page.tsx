import type { Metadata } from "next";
import { ResellerReportsClient } from "./reseller-reports-client";

export const metadata: Metadata = {
  title: "Reseller reports — Admin Control",
  description: "Growth, renewal and activity reporting for resellers.",
};

export default function Page() {
  return <ResellerReportsClient />;
}
