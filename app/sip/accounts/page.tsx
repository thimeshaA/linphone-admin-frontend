import type { Metadata } from "next";
import { SipAccountsClient } from "./accounts-client";

export const metadata: Metadata = {
  title: "SIP accounts — Admin Control",
  description:
    "Operational workspace for SIP identities: provision, renew, disable and audit accounts on the Flexisip cluster.",
  openGraph: {
    title: "SIP accounts — Admin Control",
    description:
      "Provision, renew and disable SIP identities from one workspace.",
  },
};

export default function Page() {
  return <SipAccountsClient />;
}
