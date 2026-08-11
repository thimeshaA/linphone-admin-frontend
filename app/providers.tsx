"use client";

import type { ReactNode } from "react";
import { TelephonyProvider } from "@/contexts/telephony-context";

export function Providers({ children }: { children: ReactNode }) {
  return <TelephonyProvider>{children}</TelephonyProvider>;
}
