import type { Metadata } from "next";
import { ForgotPasswordClient } from "./forgot-password-client";

export const metadata: Metadata = {
  title: "Reset your password — Admin Control",
  description: "Request a password reset link for your Admin Control login.",
};

export default function Page() {
  return <ForgotPasswordClient />;
}
