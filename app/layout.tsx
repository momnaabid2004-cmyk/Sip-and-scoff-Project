import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { Providers } from "@/components/providers/Providers";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Sip & Scoop — Chai, Coffee, Ice Cream & Snacks in Lahore", template: "%s · Sip & Scoop" },
  description: "Lahore's happiest corner for doodh patti, Spanish lattes, kulfi, sundaes, shakes, mint margaritas and club sandwiches. Dine in, pick up or get it delivered.",
  openGraph: { type: "website", siteName: "Sip & Scoop", locale: "en_PK" },
};
export const viewport: Viewport = { themeColor: "#FFF4E6", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
