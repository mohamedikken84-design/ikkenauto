import { PageIntro } from "@/components/page-intro";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Handelaars",
  description:
    "De dealeromgeving van IKKENAUTO.be volgt later. Er is nog geen zakelijk account en geen import van advertenties.",
  path: "/handelaars",
});

export default function HandelaarsPage() {
  return (
    <PageIntro
      title="Voor handelaars"
      lede="Garages en dealers krijgen later een eigen omgeving. Aanmelden als handelaar kan nog niet."
    >
      <p>
        We scrapen geen sites van handelaars en koppelen nog geen voorraad.
        Car-Pass hoort bij een latere stap en staat hier nog niet.
      </p>
      <p>
        Tot de dealeromgeving er is, blijft het aanbod gericht op de
        aankondiging van de marktplaats, niet op een professioneel account.
      </p>
    </PageIntro>
  );
}
