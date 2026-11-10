import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveActor } from "@/lib/dealer/auth";
import { publicationLabel } from "@/lib/dealer/labels";
import { listOwnStock } from "@/lib/dealer/stock";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Voorraad",
  description: "Eigen voorraad van de garage. Niet zichtbaar zolang de site gesloten is.",
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
  if (!actor?.dealerId) redirect("/account/login");
  const vehicles = await listOwnStock(actor);
  return (
    <article className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl">Voorraad</h1>
          <p className="mt-3 text-muted">De site is nog niet open voor kopers. « Klaar voor lancering » is nog niet zichtbaar.</p>
        </div>
        <Link className="inline-flex min-h-12 items-center justify-center bg-ink px-5 text-sm font-semibold text-paper" href="/account/voorraad/nieuw">
          Auto toevoegen
        </Link>
      </div>
      {vehicles.length === 0 ? (
        <p className="mt-10">Nog geen auto in uw voorraad.</p>
      ) : (
        <ul className="mt-8 grid gap-3">
          {vehicles.map((vehicle) => (
            <li key={vehicle.id} className="border border-line bg-surface p-4">
              <Link className="font-semibold underline decoration-gold decoration-2 underline-offset-4" href={`/account/voorraad/${vehicle.id}`}>
                {vehicle.make} {vehicle.model}
              </Link>
              <p className="mt-1 text-sm text-muted">
                € {vehicle.priceEur.toLocaleString("nl-BE")} · {publicationLabel(vehicle.publicationStatus)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
