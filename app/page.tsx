import { CtaLink } from "@/components/cta-link";
import { SearchForm } from "@/components/search-form";

const audiences = [
  {
    label: "Particulier",
    title: "Van mens tot mens",
    text: "Zoek straks tussen auto's van particulieren, of bereid je eigen advertentie voor. Plaatsen, wijzigen en offline halen zit nog niet in deze versie.",
  },
  {
    label: "Handelaar",
    title: "Een dealeromgeving volgt",
    text: "Garages krijgen later een eigen plek. Er is nog geen zakelijk account, geen voorraadkoppeling en geen automatische import van advertenties.",
  },
];

const steps = [
  {
    title: "Zoeken",
    text: "Merk, model en een maximale prijs. Dezelfde drie velden op de homepage en op de zoekpagina.",
  },
  {
    title: "Kiezen",
    text: "Een advertentie die de auto toont, zonder ruis van andere sites. Het aanbod zelf komt later.",
  },
  {
    title: "Contact",
    text: "Een bericht naar de aanbieder. Berichten en accounts zijn nog niet gebouwd.",
  },
];

const limits = [
  "Geen analysetracking en geen marketingcookies in deze versie.",
  "Geen accounts of berichten, dus nog geen persoonsgegevens die we voor die functies bijhouden.",
  "Geen Car-Pass. Die gegevens tonen we pas wanneer de koppeling er is.",
  "Privacy, cookies en voorwaarden zijn placeholders en nog geen geldige juridische teksten.",
];

export default function HomePage() {
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
            aanbiedt, bij particulieren en later ook bij handelaars. Eén plek,
            met merk, model en prijs als vertrekpunt.
          </p>
        </div>
      </section>

      <div className="mx-auto -mt-16 w-full max-w-6xl px-4">
        <SearchForm idPrefix="home" />
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
              De routes staan klaar. De functies volgen.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-paper/80">
              Bekijk hoe zoeken, adverteren en de handelaarsomgeving er op de
              kaart liggen. Niets daarvan verwerkt vandaag al een echte
              advertentie.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <CtaLink href="/zoeken" variant="inverse">
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
