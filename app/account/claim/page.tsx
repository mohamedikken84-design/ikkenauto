import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthForm, Field } from "@/components/auth-form";
import { resolveActor } from "@/lib/dealer/auth";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Garage claimen",
  description: "Dien een claim in voor een bestaande garage. Er is geen automatische overdracht.",
  path: "/account/claim",
});

export default function ClaimPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16">Aanvraag laden…</p>}>
      <ClaimScreen />
    </Suspense>
  );
}

async function ClaimScreen() {
  const token = (await cookies()).get("ikken_session")?.value ?? "";
  const actor = token ? await resolveActor(token).catch(() => null) : null;
  if (!actor) redirect("/account/login");
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl">Bestaande garage claimen</h1>
      <p className="mt-4 leading-relaxed text-muted">
        Dit blijft een aanvraag. KBO, naam of e-mail dragen geen eigendom over. Een beheerder beoordeelt later het
        bewijs. Er gaat geen bericht naar de garage.
      </p>
      <AuthForm action="/api/auth/claim" submitLabel="Aanvraag indienen" pendingLabel="Indienen…" locale="nl">
        <Field id="claim-kbo" label="KBO-nummer" name="kboNumber" />
        <label className="text-sm font-semibold" htmlFor="claim-bewijs">
          Bewijs
          <textarea
            id="claim-bewijs"
            name="evidence"
            required
            minLength={20}
            rows={5}
            className="mt-2 w-full border border-line bg-paper px-3 py-3 font-normal"
          />
        </label>
      </AuthForm>
    </article>
  );
}
