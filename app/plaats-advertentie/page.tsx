import { PageIntro } from "@/components/page-intro";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Plaats advertentie",
  description:
    "Advertentie plaatsen op IKKENAUTO.be volgt later. Er is nog geen formulier en geen publicatie.",
  path: "/plaats-advertentie",
});

export default function PlaatsAdvertentiePage() {
  return (
    <PageIntro
      title="Plaats een advertentie"
      lede="Particulieren kunnen hier later een auto aanbieden. Het formulier, de foto's en de publicatie zijn nog niet gebouwd."
    >
      <p>Een advertentie zal straks minstens dit bevatten:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>merk, model en prijs</li>
        <li>een korte beschrijving</li>
        <li>foto&apos;s van de auto</li>
      </ul>
      <p>
        Er wordt op deze pagina niets bewaard. Een lokaal account beheert nog
        geen advertentie.
      </p>
    </PageIntro>
  );
}
