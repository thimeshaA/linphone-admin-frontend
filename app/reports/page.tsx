import type { Metadata } from "next";
import { ReportsClient } from "./reports-client";

export const metadata: Metadata = {
  title: "Reports — Admin Control",
  description: "Cross-module reporting.",
};

export default function Page() {
  return <ReportsClient />;
}
