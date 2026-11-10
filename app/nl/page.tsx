import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "IKKENAUTO.be",
    description: "Zoek een auto in België. De marktplaats is nog in opbouw.",
    path: "/nl",
  }),
  alternates: {
    canonical: "/nl",
    languages: { "nl-BE": "/nl", "fr-BE": "/fr" },
  },
};

export default function DutchHomePage() {
  return <HomePage locale="nl" />;
}
