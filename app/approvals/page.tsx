import type { Metadata } from "next";
import { ApprovalsClient } from "./approvals-client";

export const metadata: Metadata = {
  title: "Approval queue — Admin Control",
  description:
    "Review reseller applications and account requests submitted through the public intake form.",
  openGraph: {
    title: "Approval queue — Admin Control",
    description: "Review and decide on incoming access requests.",
  },
};

export default function Page() {
  return <ApprovalsClient />;
}
