import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveActor } from "@/lib/dealer/auth";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Voorraad",
  description: "De voorraad van uw garage. Het invulformulier volgt in de volgende stap.",
  path: "/account/voorraad",
});

export default function StockPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16">Voorraad laden…</p>}>
      <StockScreen />
    </Suspense>
  );
}

async function StockScreen() {
  const token = (await cookies()).get("ikken_session")?.value ?? "";
  const actor = token ? await resolveActor(token).catch(() => null) : null;
  if (!actor) redirect("/account/login");
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl">Voorraad</h1>
      <p className="mt-4 leading-relaxed">Nog geen auto in uw voorraad. Het formulier om een auto toe te voegen volgt in de volgende stap.</p>
      <p className="mt-6">
        <Link className="inline-flex min-h-11 items-center font-semibold underline decoration-gold decoration-2 underline-offset-4" href="/account/garage">
          Garageprofiel
        </Link>
      </p>
    </article>
  );
}
