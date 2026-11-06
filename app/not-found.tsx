import Link from "next/link";

export default function NotFound() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-20">
      <p className="text-xs font-semibold tracking-[0.18em] text-gold-deep uppercase">
        404
      </p>
      <h1 className="mt-3 font-display text-4xl leading-tight text-ink md:text-5xl">
        Deze pagina bestaat niet
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-muted">
        Het adres klopt niet, of de route is nog niet gebouwd. Ga terug naar de
        homepage van IKKENAUTO.be.
      </p>
      <p className="mt-10">
        <Link
          href="/"
          className="text-sm font-semibold text-ink underline decoration-gold decoration-2 underline-offset-4 hover:text-gold-deep"
        >
          Naar de homepage
        </Link>
      </p>
    </article>
  );
}
