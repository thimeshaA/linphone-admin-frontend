import type { Metadata } from "next";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Settings — Admin Control",
  description: "Platform preferences.",
};

export default function Page() {
  return <SettingsClient />;
}
