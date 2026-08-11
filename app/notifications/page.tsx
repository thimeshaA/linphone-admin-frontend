import type { Metadata } from "next";
import { NotificationsClient } from "./notifications-client";

export const metadata: Metadata = {
  title: "Notifications — Admin Control",
  description: "Platform alerts and notifications.",
};

export default function Page() {
  return <NotificationsClient />;
}
