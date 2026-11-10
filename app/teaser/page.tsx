import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Binnenkort",
  description: "IKKENAUTO.be is nog niet open voor kopers.",
  path: "/teaser",
  index: false,
});

export default function TeaserPage() {
  return (
    <article className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className="font-display text-4xl">IKKENAUTO.be is in opbouw</h1>
      <p className="mt-4 leading-relaxed">
        De marktplaats is nog niet open voor kopers. Dealers kunnen hun voorraad al klaarzetten via hun account. Er is geen publieke voorraad op deze pagina.
      </p>
      <form className="mt-8 grid gap-3" method="post" action="/api/preview">
        <label className="text-sm font-semibold" htmlFor="preview-password">
          Voorbeeldsleutel
          <input id="preview-password" name="password" type="password" autoComplete="current-password" className="mt-2 min-h-12 w-full border border-line px-3 text-base" />
        </label>
        <button type="submit" className="min-h-12 bg-ink px-5 text-sm font-semibold text-paper">
          Voorbeeld openen
        </button>
      </form>
    </article>
  );
}
