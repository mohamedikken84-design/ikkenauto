import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { resolveActor } from "@/lib/dealer/auth";
import { readOwnProfile } from "@/lib/dealer/account";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Account",
  description: "Uw IKKENAUTO-account.",
  path: "/account",
});

export default function AccountPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16">Account laden…</p>}>
      <AccountScreen />
    </Suspense>
  );
}

async function AccountScreen() {
  const token = (await cookies()).get("ikken_session")?.value ?? "";
  const actor = token ? await resolveActor(token).catch(() => null) : null;
  if (!actor) redirect("/account/login");
  const profile = await readOwnProfile(actor);
  const kind =
    actor.role === "platform_admin" ? "Beheer" : actor.role === "private_user" ? "Particulier" : "Professioneel";

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl">Account</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        U bent aangemeld als {kind}.
      </p>
      <dl className="mt-8 grid gap-3 text-sm">
        <div>
          <dt className="text-muted">Naam</dt>
          <dd className="font-semibold">{profile.displayName}</dd>
        </div>
        <div>
          <dt className="text-muted">Rol</dt>
          <dd className="font-semibold">{kind}</dd>
        </div>
      </dl>
      <ul className="mt-8 flex flex-col gap-3 text-sm font-semibold">
        <li>
          <Link className="underline decoration-gold decoration-2 underline-offset-4" href="/account/profiel">
            Privéprofiel
          </Link>
        </li>
        <li>
          <Link className="underline decoration-gold decoration-2 underline-offset-4" href="/account/voorraad">
            Voorraad
          </Link>
          <Link className="underline decoration-gold decoration-2 underline-offset-4" href="/account/garage">
            Garage
          </Link>
        </li>
      </ul>
      <AuthForm action="/api/auth/logout" submitLabel="Afmelden" pendingLabel="Afmelden…" locale="nl" />
      <p className="mt-6 text-sm leading-6 text-muted">
        De privacytekst op deze site is nog niet juridisch beoordeeld. Er is geen marketinginschrijving.
      </p>
    </article>
  );
}
