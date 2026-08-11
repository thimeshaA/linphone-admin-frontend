import type { Metadata } from "next";
import { SipResellersClient } from "./resellers-client";

export const metadata: Metadata = {
  title: "SIP resellers — Admin Control",
  description: "Organisations approved for the SIP module.",
};

export default function Page() {
  return <SipResellersClient />;
}
