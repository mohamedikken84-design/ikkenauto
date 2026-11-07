import { PageIntro } from "@/components/page-intro";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Privacy",
  description:
    "Voorlopige pagina voor de privacyverklaring van IKKENAUTO.be. Dit is nog geen geldige GDPR-tekst.",
  path: "/privacy",
  index: false,
});

export default function PrivacyPage() {
  return (
    <PageIntro
      eyebrow="Nog geen beleid"
      title="Privacy"
      lede="Dit is nog geen privacyverklaring. De tekst wordt vastgelegd voor IKKENAUTO.be persoonsgegevens verwerkt voor accounts, advertenties of berichten."
    >
      <p>
        Deze versie plaatst geen analysetracking en geen marketingcookies. Een
        lokaal account bewaart naam, e-mail en een wachtwoordhash in de
        ontwikkeldatabase. Dat is nog geen juridisch beoordeelde privacytekst en
        geen toestemming voor marketing.
      </p>
      <p>
        Wanneer die functies er zijn, beschrijft de verklaring het doel, de
        bewaartermijn en je rechten onder de GDPR, waaronder inzage, verbetering
        en wissing. Een contactkanaal voor privacyvragen komt op dat moment mee.
      </p>
    </PageIntro>
  );
}
