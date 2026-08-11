import type { Metadata } from "next";
import { MyAccountClient } from "./my-account-client";

export const metadata: Metadata = {
  title: "My account — Admin Control",
  description: "View the status and expiry date of your SIP account.",
  openGraph: {
    title: "My account — Admin Control",
    description: "Your SIP account status and expiry at a glance.",
  },
};

export default function Page() {
  return <MyAccountClient />;
}
