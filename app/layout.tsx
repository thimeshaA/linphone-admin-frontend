import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "../styles/globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Admin Control — SIP operations",
  description:
    "Operations console for provisioning, renewing and auditing SIP identities on Flexisip infrastructure.",
  // app/favicon.ico is picked up automatically via Next's file convention —
  // this only adds the larger PNG variant on top, for Apple touch icons/etc.
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: "/icon.png",
  },
  openGraph: {
    title: "Admin Control",
    description: "SIP account administration console.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
