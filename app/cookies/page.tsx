import { PageIntro } from "@/components/page-intro";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Cookies",
  description:
    "Voorlopige pagina voor de cookieverklaring van IKKENAUTO.be. Deze versie plaatst geen marketingcookies.",
  path: "/cookies",
  index: false,
});

export default function CookiesPage() {
  return (
    <PageIntro
      eyebrow="Nog geen beleid"
      title="Cookies"
      lede="Dit is nog geen cookieverklaring. Ze volgt samen met de privacyverklaring."
    >
      <p>
        Deze versie plaatst geen analysecookies en geen marketingcookies. We
        claimen geen meet- of advertentienetwerk.
      </p>
      <p>
        Een volledige lijst van technische cookies, als die er later bijkomen,
        staat dan in deze verklaring, met het doel en de duur.
      </p>
    </PageIntro>
  );
}
