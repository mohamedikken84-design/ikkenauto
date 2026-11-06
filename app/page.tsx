import { CtaLink } from "@/components/cta-link";
import { HomeSearch } from "@/components/home-search";
import { knownPostcodes, modelsByMake } from "@/lib/listings/seed";

const audiences = [
  {
    label: "Particulier",
    title: "Van mens tot mens",
    text: "In de seed zitten ook een paar particuliere voorbeelden. Zelf een advertentie plaatsen kan nog niet.",
  },
  {
    label: "Handelaar",
    title: "Een dealeromgeving volgt",
    text: "De lijst toont fictieve dealers, geen gekoppelde voorraad. Een echte dealeromgeving volgt later.",
  },
];

const steps = [
  {
    title: "Zoeken",
    text: "Filter de dealerseed op merk, model, prijs, kilometer, bouwjaar, brandstof en afstand.",
  },
  {
    title: "Kiezen",
    text: "Open een advertentie voor kenmerken, BTW-regime, verkoper en een lokaal contactformulier.",
  },
  {
    title: "Contact",
    text: "Het formulier blijft op dit apparaat. Er is nog geen mail naar de verkoper en geen account.",
  },
];

const limits = [
  "Geen analysetracking en geen marketingcookies in deze versie.",
  "Geen accounts. Een contactbericht op een advertentie blijft lokaal in je browser.",
  "Geen Car-Pass. Die gegevens tonen we pas wanneer de koppeling er is.",
  "Privacy, cookies en voorwaarden zijn placeholders en nog geen geldige juridische teksten.",
];

export default function HomePage() {
  const groupedModels = modelsByMake();
  return (
    <>
      <section aria-labelledby="belofte" className="bg-ink text-paper">
        <div className="mx-auto w-full max-w-6xl px-4 pt-16 pb-28 md:pt-24 md:pb-32">
          <p className="text-xs font-semibold tracking-[0.18em] text-gold uppercase">
            België · particulier en handelaar
          </p>
          <h1
            id="belofte"
            className="mt-4 max-w-3xl font-display text-4xl leading-[1.08] font-medium md:text-6xl"
          >
            Vind je volgende auto in België.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/80">
            IKKENAUTO.be wordt de marktplaats waar je een auto zoekt of
            aanbiedt, bij particulieren en later ook bij handelaars. Zoek in de
            voorbeeldcatalogus op merk, model, prijs, bouwjaar en postcode.
          </p>
        </div>
      </section>

      <div className="mx-auto -mt-16 w-full max-w-6xl px-4">
        <HomeSearch
          makes={Object.keys(groupedModels)}
          modelsByMake={groupedModels}
          postcodes={knownPostcodes().map((entry) => ({
            postalCode: entry.postalCode,
            city: entry.city,
          }))}
        />
      </div>

      <section aria-labelledby="markt" className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <h2 id="markt" className="font-display text-3xl leading-tight md:text-4xl">
            Eerst particulieren, daarna handelaars
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            De markt start bij mensen die een auto verkopen. Professionele
            verkopers komen erbij zodra hun omgeving klaar is. We nemen hun
            aanbod nu niet over.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {audiences.map((item) => (
            <article key={item.label} className="border border-line bg-surface p-6">
              <p className="text-xs font-semibold tracking-[0.16em] text-gold-deep uppercase">
                {item.label}
              </p>
              <h3 className="mt-3 font-display text-2xl">{item.title}</h3>
              <p className="mt-3 leading-relaxed text-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="stappen" className="border-y border-line bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
          <h2 id="stappen" className="font-display text-3xl leading-tight md:text-4xl">
            Drie stappen, zodra het aanbod er is
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="border-t-2 border-gold pt-4">
                <p className="text-sm font-semibold text-gold-deep">
                  0{index + 1}
                </p>
                <h3 className="mt-2 font-display text-2xl">{step.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="grenzen" className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
        <h2 id="grenzen" className="font-display text-3xl leading-tight md:text-4xl">
          Eerlijk over wat er nog niet is
        </h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {limits.map((item) => (
            <li
              key={item}
              className="border border-line bg-surface px-5 py-4 leading-relaxed"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="verder" className="bg-ink text-paper">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 md:flex-row md:items-end md:justify-between md:py-20">
          <div className="max-w-xl">
            <h2 id="verder" className="font-display text-3xl leading-tight md:text-4xl">
              Bekijk de dealerseed.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-paper/80">
              Zoeken en advertenties werken op fictieve voorraad. Plaatsen,
              mailen en een echte dealeromgeving volgen nog.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <CtaLink href="/nl/autos" variant="inverse">
              Naar zoeken
            </CtaLink>
            <CtaLink href="/plaats-advertentie" variant="secondary">
              Plaats advertentie
            </CtaLink>
            <CtaLink href="/handelaars" variant="secondary">
              Voor handelaars
            </CtaLink>
          </div>
        </div>
      </section>
    </>
  );
}
