"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  MoreHorizontal,
  PhoneCall,
  Signal,
} from "lucide-react";
import { LensTabBar, type LensTab } from "@/components/telephony/lens-tab-bar";
import { ThemeToggle } from "@/components/telephony/theme-toggle";
import { useTelephony } from "@/contexts/telephony-context";

// TEMPORARY — visual QA harness for the lens tab bar. Not part of the app;
// deleted after use. Renders LensTabBar directly with local state instead
// of real routing, so dragging/tapping never navigates away from here.

const DEMO_TABS: LensTab[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    accent: "success",
  },
  { id: "sip", label: "SIP", icon: PhoneCall, accent: "sip" },
  { id: "esim", label: "eSIM", icon: Signal, accent: "esim" },
  { id: "more", label: "More", icon: MoreHorizontal },
];

function ToggleBar() {
  const { theme } = useTelephony();
  return (
    <div style={{ padding: 24 }}>
      <p style={{ marginBottom: 12 }}>
        Lens tab bar test harness — {theme} mode
      </p>
      <ThemeToggle />
    </div>
  );
}

export default function NavPreviewPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <ToggleBar />
      <p style={{ padding: "0 24px" }}>
        Active: <strong>{DEMO_TABS[activeIndex]?.label}</strong>
      </p>
      <LensTabBar
        tabs={DEMO_TABS}
        activeIndex={activeIndex}
        onActivate={setActiveIndex}
      />
    </div>
  );
}
