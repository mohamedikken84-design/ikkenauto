import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveActor } from "@/lib/dealer/auth";
import { readOwnProfile } from "@/lib/dealer/account";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Privéprofiel",
  description: "Privéprofiel van een lokaal IKKENAUTO-account. Niet publiek.",
  path: "/account/profiel",
});

export default function ProfilePage() {
  return (
    <Suspense fallback={<p className="px-4 py-16">Profiel laden…</p>}>
      <ProfileScreen />
    </Suspense>
  );
}

async function ProfileScreen() {
  const token = (await cookies()).get("ikken_session")?.value ?? "";
  const actor = token ? await resolveActor(token).catch(() => null) : null;
  if (!actor || actor.role === "platform_admin") redirect("/account/login");
  const profile = await readOwnProfile(actor);
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl">Privéprofiel</h1>
      <p className="mt-4 leading-relaxed text-muted">Dit profiel staat niet in de publieke voorraad of een open API.</p>
      <dl className="mt-8 grid gap-3">
        <div>
          <dt className="text-sm text-muted">Naam</dt>
          <dd className="font-semibold">{profile.displayName}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">E-mail</dt>
          <dd className="font-semibold">{profile.email}</dd>
        </div>
      </dl>
    </article>
  );
}
