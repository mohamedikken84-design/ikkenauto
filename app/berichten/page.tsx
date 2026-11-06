import { PageIntro } from "@/components/page-intro";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Berichten",
  description:
    "Berichten op IKKENAUTO.be komen later. Er is nog geen postvak en geen verzending.",
  path: "/berichten",
});

export default function BerichtenPage() {
  return (
    <PageIntro
      title="Berichten"
      lede="Contact tussen zoeker en aanbieder hoort bij de advertentie. Berichten versturen kan nog niet."
    >
      <p>
        Er is geen berichtenbackend, geen melding en geen opslag van
        gesprekken. Tot die module er is, verwerken we hier geen
        persoonsgegevens voor contact.
      </p>
    </PageIntro>
  );
}
