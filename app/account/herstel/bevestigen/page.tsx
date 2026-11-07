import { Suspense } from "react";
import { AuthForm, Field } from "@/components/auth-form";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Nieuw wachtwoord",
  description: "Stel eenmalig een nieuw wachtwoord in voor een lokaal IKKENAUTO-account.",
  path: "/account/herstel/bevestigen",
});

export default function RecoveryConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <Suspense fallback={<p className="px-4 py-16">Herstel laden…</p>}>
      <RecoveryConfirmScreen searchParams={searchParams} />
    </Suspense>
  );
}

async function RecoveryConfirmScreen({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token ?? "";
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl">Nieuw wachtwoord</h1>
      <p className="mt-4 leading-relaxed text-muted">Deze link werkt één keer en vervalt na een uur. Bestaande sessies worden ingetrokken.</p>
      <AuthForm action="/api/auth/recovery/confirm" submitLabel="Wachtwoord opslaan">
        <input type="hidden" name="token" value={token} />
        <Field id="nieuw-wachtwoord" label="Nieuw wachtwoord" name="password" type="password" autoComplete="new-password" />
      </AuthForm>
    </article>
  );
}
