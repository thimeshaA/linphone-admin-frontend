import type { Metadata } from "next";
import { OverviewClient } from "./overview-client";

export const metadata: Metadata = {
  title: "Overview — Admin Control",
  description:
    "Platform overview: module access, account health and pending approvals.",
  openGraph: {
    title: "Overview — Admin Control",
    description: "SIP and eSIM operations modules in one console.",
  },
};

export default function Page() {
  return <OverviewClient />;
}
