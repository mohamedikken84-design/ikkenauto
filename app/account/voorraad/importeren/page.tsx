import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ImportWizard } from "@/components/import-wizard";
import { resolveActor } from "@/lib/dealer/auth";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Voorraad importeren",
  description: "Bekijk een CSV-voorvertoning voor uw garage. Er wordt niets gewist bij een fout.",
  path: "/account/voorraad/importeren",
});

export default function ImportPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16">Import laden…</p>}>
      <ImportScreen />
    </Suspense>
  );
}

async function ImportScreen() {
  const token = (await cookies()).get("ikken_session")?.value ?? "";
  const actor = token ? await resolveActor(token).catch(() => null) : null;
  if (!actor || actor.role !== "dealer_admin") redirect("/account/login");
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10">
      <p className="text-sm">
        <Link className="underline decoration-gold decoration-2 underline-offset-4" href="/account/voorraad">
          Naar voorraad
        </Link>
      </p>
      <h1 className="mt-4 font-display text-4xl">Voorraad importeren</h1>
      <p className="mt-3 text-muted">
        De voorvertoning schrijft niets. Bevestigen werkt bij op het bronnummer van deze garage en maakt geen dubbel.
      </p>
      <ImportWizard />
    </article>
  );
}
