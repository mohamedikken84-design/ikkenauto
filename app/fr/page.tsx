import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "IKKENAUTO.be",
    description: "Cherchez une voiture en Belgique. La place de marché est encore en construction.",
    path: "/fr",
  }),
  alternates: {
    canonical: "/fr",
    languages: { "nl-BE": "/nl", "fr-BE": "/fr" },
  },
};

export default function FrenchHomePage() {
  return <HomePage locale="fr" />;
}
