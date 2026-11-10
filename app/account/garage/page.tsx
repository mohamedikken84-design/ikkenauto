import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readOwnProfile } from "@/lib/dealer/account";
import { resolveActor } from "@/lib/dealer/auth";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Garage",
  description: "Status van een professionele garage. Niet automatisch geverifieerd of openbaar.",
  path: "/account/garage",
});

const garageStatus: Record<string, string> = {
  unverified: "niet geverifieerd",
  pending_review: "in beoordeling",
  verified: "geverifieerd",
};

export default function GaragePage({ searchParams }: { searchParams: Promise<{ welkom?: string }> }) {
  return (
    <Suspense fallback={<p className="px-4 py-16">Garage laden…</p>}>
      <GarageScreen searchParams={searchParams} />
    </Suspense>
  );
}

async function GarageScreen({ searchParams }: { searchParams: Promise<{ welkom?: string }> }) {
  const welcome = (await searchParams).welkom === "1";
  const token = (await cookies()).get("ikken_session")?.value ?? "";
  const actor = token ? await resolveActor(token).catch(() => null) : null;
  if (!actor) redirect("/account/login");
  const profile = await readOwnProfile(actor);
  const status = profile.garage ? (garageStatus[profile.garage.verification_status] ?? profile.garage.verification_status) : "";
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl">Garage</h1>
      {welcome ? (
        <p className="mt-4 leading-relaxed">Welkom bij IKKENAUTO. Vul uw garage aan. Kopers zien niets zolang de site gesloten is.</p>
      ) : null}
      {profile.garage ? (
        <>
          <p className="mt-4 text-lg">{profile.garage.trade_name}</p>
          <p className="mt-2 text-sm text-muted">
            Status: {status}. Openbaar: {profile.garage.is_public ? "ja" : "nee"}.
          </p>
          <p className="mt-4 leading-relaxed">
            {profile.garage.verification_status === "verified"
              ? "Deze garage is geverifieerd. Publicatie volgt de bestaande voorraadregels."
              : "De garage hoort bij dit account en is nog niet geverifieerd voor het publiek."}{" "}
            Een pakket of pilot heeft nog geen vastgelegde voorwaarden. Er is geen abonnement en geen factuur.
          </p>
        </>
      ) : (
        <p className="mt-4 leading-relaxed text-muted">
          Een particulier heeft geen garage. Een bestaande garage overnemen kan alleen als aanvraag, niet via naam of
          e-mail.
        </p>
      )}
      <p className="mt-6 text-sm">
        <Link className="font-semibold underline decoration-gold decoration-2 underline-offset-4" href="/account/claim">
          Bestaande garage claimen
        </Link>
      </p>
    </article>
  );
}
