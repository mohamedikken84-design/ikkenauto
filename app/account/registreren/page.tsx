import Link from "next/link";
import { AuthForm, Field } from "@/components/auth-form";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Registreren",
  description: "Registreer lokaal als particulier of professioneel. Geen productieaccount.",
  path: "/account/registreren",
});

export default function RegisterPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16">
      <p className="text-xs font-semibold tracking-[0.16em] text-gold-deep uppercase">Lokaal account</p>
      <h1 className="mt-3 font-display text-4xl">Registreren</h1>
      <p className="mt-4 leading-relaxed text-muted">
        Kies particulier of professioneel. Een nieuw account blijft minimaal bevoegd tot het adres
        bevestigd is. Een professionele garage wordt niet automatisch geverifieerd of openbaar.
      </p>
      <AuthForm action="/api/auth/register" submitLabel="Account aanmaken">
        <fieldset className="grid gap-2">
          <legend className="text-sm font-semibold">Ik registreer als</legend>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="radio" name="kind" value="particulier" defaultChecked required />
            Particulier
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="radio" name="kind" value="professioneel" required />
            Professioneel
          </label>
        </fieldset>
        <Field id="reg-naam" label="Naam" name="displayName" autoComplete="name" />
        <Field id="reg-email" label="E-mail" name="email" type="email" autoComplete="email" />
        <Field id="reg-wachtwoord" label="Wachtwoord" name="password" type="password" autoComplete="new-password" />
        <fieldset className="grid gap-4 border border-line p-4">
          <legend className="px-1 text-sm font-semibold">Alleen voor professioneel</legend>
          <Field id="reg-handelsnaam" label="Handelsnaam" name="tradeName" autoComplete="organization" required={false} />
          <Field id="reg-kbo" label="KBO-nummer" name="kboNumber" required={false} />
          <Field id="reg-btw" label="BTW-nummer" name="vatNumber" required={false} />
          <Field id="reg-postcode" label="Postcode" name="postalCode" autoComplete="postal-code" required={false} />
          <Field id="reg-plaats" label="Plaats" name="city" autoComplete="address-level2" required={false} />
        </fieldset>
      </AuthForm>
      <p className="mt-6 text-sm leading-6 text-muted">
        Het verificatiebericht gaat alleen naar de lokale testpost, niet naar een externe mailbox. Een pakket
        of pilot wordt hier niet verkocht: er is geen prijs, abonnement of factuur.
      </p>
      <p className="mt-4 text-sm">
        <Link className="font-semibold underline decoration-gold decoration-2 underline-offset-4" href="/account/login">
          Al een account? Aanmelden
        </Link>
      </p>
    </article>
  );
}
