import type { Metadata } from "next";
import { OverviewClient } from "./overview-client";

export const metadata: Metadata = {
  title: "Overview — Admin Control",
  description: "Platform overview: module access and account health.",
  openGraph: {
    title: "Overview — Admin Control",
    description: "SIP operations module in one console.",
  },
};

export default function Page() {
  return <OverviewClient />;
}
