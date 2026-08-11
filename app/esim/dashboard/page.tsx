import type { Metadata } from "next";
import { EsimDashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "eSIM dashboard — Admin Control",
  description:
    "eSIM profile management module: inventory, activation and data plans. Access is granted per organisation.",
};

export default function Page() {
  return <EsimDashboardClient />;
}
