import type { Metadata } from "next";
import { EsimResellersClient } from "./resellers-client";

export const metadata: Metadata = {
  title: "eSIM resellers — Admin Control",
  description: "Organisations approved for the eSIM module.",
};

export default function Page() {
  return <EsimResellersClient />;
}
