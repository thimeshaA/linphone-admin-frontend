import type { Metadata } from "next";
import { LoginClient } from "./login-client";

export const metadata: Metadata = {
  title: "Sign in — Admin Control",
  description:
    "Sign in to Admin Control, the operations console for SIP and eSIM account provisioning, renewals and access approvals.",
  openGraph: {
    title: "Sign in — Admin Control",
    description:
      "Operations console for SIP and eSIM account provisioning and approvals.",
  },
};

export default function Page() {
  return <LoginClient />;
}
