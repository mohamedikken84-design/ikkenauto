import { PageIntro } from "@/components/page-intro";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Voorwaarden",
  description:
    "Voorlopige pagina voor de algemene voorwaarden van IKKENAUTO.be. Dit zijn nog geen bindende voorwaarden.",
  path: "/voorwaarden",
  index: false,
});

export default function VoorwaardenPage() {
  return (
    <PageIntro
      eyebrow="Nog geen beleid"
      title="Voorwaarden"
      lede="Dit zijn nog geen algemene voorwaarden. Er is nog geen geldige tekst voor gebruik, advertenties of handel tussen gebruikers."
    >
      <p>
        De site toont het skelet van de marktplaats. Je kunt nog geen
        advertentie plaatsen, geen bericht sturen en geen account openen.
      </p>
      <p>
        Bindende afspraken publiceren we pas wanneer de marktplaats die
        functies echt aanbiedt.
      </p>
    </PageIntro>
  );
}
