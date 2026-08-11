import type { Metadata } from "next";
import { EsimCountriesClient } from "./countries-client";

export const metadata: Metadata = {
  title: "eSIM countries — Admin Control",
  description: "Per-country eSIM coverage.",
};

export default function Page() {
  return <EsimCountriesClient />;
}
