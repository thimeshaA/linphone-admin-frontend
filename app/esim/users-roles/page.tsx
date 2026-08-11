import type { Metadata } from "next";
import { EsimUsersRolesClient } from "./users-roles-client";

export const metadata: Metadata = {
  title: "eSIM users & roles — Admin Control",
  description: "Platform users with eSIM module access.",
};

export default function Page() {
  return <EsimUsersRolesClient />;
}
