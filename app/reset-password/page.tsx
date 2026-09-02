import type { Metadata } from "next";
import { ResetPasswordClient } from "./reset-password-client";

export const metadata: Metadata = {
  title: "Set a new password — Admin Control",
  description: "Set a new password for your Admin Control login.",
};

export default function Page() {
  return <ResetPasswordClient />;
}
