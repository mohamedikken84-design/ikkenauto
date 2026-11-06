import Link from "next/link";

type PageIntroProps = {
  eyebrow?: string;
  title: string;
  lede: string;
  children?: React.ReactNode;
};

export function PageIntro({
  eyebrow = "Nog niet gebouwd",
  title,
  lede,
  children,
}: PageIntroProps) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16 md:py-20">
      <p className="text-xs font-semibold tracking-[0.18em] text-gold-deep uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-4xl leading-tight text-ink md:text-5xl">
        {title}
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-muted">{lede}</p>
      {children ? (
        <div className="mt-8 space-y-4 leading-relaxed text-ink">{children}</div>
      ) : null}
      <p className="mt-10">
        <Link
          href="/"
          className="text-sm font-semibold text-ink underline decoration-gold decoration-2 underline-offset-4 hover:text-gold-deep"
        >
          Terug naar de homepage
        </Link>
      </p>
    </article>
  );
}
