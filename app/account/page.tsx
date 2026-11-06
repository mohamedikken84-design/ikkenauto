import { PageIntro } from "@/components/page-intro";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Account",
  description:
    "Accounts op IKKENAUTO.be volgen later. Er is nog geen registratie of aanmelding.",
  path: "/account",
});

export default function AccountPage() {
  return (
    <PageIntro
      title="Account"
      lede="Een account komt er voor particulieren en, apart, voor handelaars. Inloggen en registreren kan nog niet."
    >
      <p>
        Deze pagina vraagt geen e-mailadres en geen wachtwoord. Zolang er geen
        account is, is er ook geen profiel om in te zien, te verbeteren of te
        wissen.
      </p>
    </PageIntro>
  );
}
