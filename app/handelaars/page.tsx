import { PageIntro } from "@/components/page-intro";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Handelaars",
  description:
    "Een professionele registratie maakt een eigen, niet-openbare garage. Bestaande garages worden niet automatisch overgenomen.",
  path: "/handelaars",
});

export default function HandelaarsPage() {
  return (
    <PageIntro
      title="Voor handelaars"
      lede="Een professionele registratie maakt een eigen garage die niet automatisch geverifieerd of openbaar is. Een bestaande garage overnemen kan niet via deze pagina."
    >
      <p>
        We scrapen geen sites van handelaars en koppelen nog geen voorraad.
        Car-Pass hoort bij een latere stap en staat hier nog niet.
      </p>
      <p>
        Registreren als professioneel kan lokaal via het account. De garage blijft
        ongeverifieerd en niet openbaar tot een beheerder dat later beoordeelt.
        Voorraad invoeren blijft de bestaande dealer-API, niet deze pagina.
      </p>
    </PageIntro>
  );
}
