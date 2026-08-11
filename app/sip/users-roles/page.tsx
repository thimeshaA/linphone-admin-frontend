import type { Metadata } from "next";
import { SipUsersRolesClient } from "./users-roles-client";

export const metadata: Metadata = {
  title: "SIP users & roles — Admin Control",
  description: "Platform users with SIP module access.",
};

export default function Page() {
  return <SipUsersRolesClient />;
}
