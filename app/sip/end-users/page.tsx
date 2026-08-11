import type { Metadata } from "next";
import { SipEndUsersClient } from "./end-users-client";

export const metadata: Metadata = {
  title: "SIP end users — Admin Control",
  description: "Customer-facing identities behind SIP accounts.",
};

export default function Page() {
  return <SipEndUsersClient />;
}
