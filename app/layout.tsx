import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "IKKENAUTO — Dealerportaal V2",
  description: "Een overzichtelijke werkplek voor autohandelaars. Ontwerppreview van IKKENAUTO V2.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="nl"><body>{children}</body></html>;
}
