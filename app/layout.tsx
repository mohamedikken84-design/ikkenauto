import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLocale } from "@/lib/i18n/locale";
import { site } from "@/lib/site";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: "%s · IKKENAUTO.be",
  },
  description: site.description,
  applicationName: site.domainLabel,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: site.title,
    description: site.description,
    locale: "nl_BE",
    type: "website",
    siteName: site.domainLabel,
    url: site.url,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<Shell locale="nl">{children}</Shell>}>
      <LocalizedShell>{children}</LocalizedShell>
    </Suspense>
  );
}

async function LocalizedShell({ children }: { children: React.ReactNode }) {
  return <Shell locale={await getLocale()}>{children}</Shell>;
}

function Shell({ locale, children }: { locale: "nl" | "fr"; children: React.ReactNode }) {
  return (
    <html lang={locale} className={`${sourceSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        <a className="skip-link" href="#inhoud">
          {locale === "fr" ? "Aller au contenu" : "Ga naar de inhoud"}
        </a>
        <SiteHeader locale={locale} />
        <main id="inhoud" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
