import type { Metadata } from "next";
import { EsimEndUsersClient } from "./end-users-client";

export const metadata: Metadata = {
  title: "eSIM end users — Admin Control",
  description: "Customer-facing identities behind eSIM profiles.",
};

export default function Page() {
  return <EsimEndUsersClient />;
}
