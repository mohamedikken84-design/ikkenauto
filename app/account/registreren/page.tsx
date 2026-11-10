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
        Maak een account aan om de voorraad van uw garage klaar te zetten. De site is nog niet open voor
        kopers. Een professionele garage wordt niet automatisch geverifieerd of openbaar. In de gesloten
        dealeromgeving registreert u als professioneel. Particulier blijft beschikbaar in de API.
      </p>
      <AuthForm action="/api/auth/register" submitLabel="Account aanmaken">
        <input type="hidden" name="kind" value="professioneel" />
        <Field id="reg-naam" label="Naam" name="displayName" autoComplete="name" />
        <Field id="reg-email" label="E-mail" name="email" type="email" autoComplete="email" />
        <Field id="reg-wachtwoord" label="Wachtwoord" name="password" type="password" autoComplete="new-password" />
        <Field id="reg-wachtwoord-2" label="Wachtwoord bevestigen" name="passwordConfirm" type="password" autoComplete="new-password" />
        <fieldset className="grid gap-4 border border-line p-4">
          <legend className="px-1 text-sm font-semibold">Alleen voor professioneel</legend>
          <Field id="reg-handelsnaam" label="Handelsnaam" name="tradeName" autoComplete="organization" />
          <Field id="reg-kbo" label="KBO-nummer" name="kboNumber" />
          <Field id="reg-btw" label="Btw-nummer" name="vatNumber" />
          <Field id="reg-postcode" label="Postcode" name="postalCode" autoComplete="postal-code" />
          <Field id="reg-plaats" label="Gemeente" name="city" autoComplete="address-level2" />
        </fieldset>
        <label className="flex min-h-11 items-start gap-3 text-sm leading-6">
          <input className="mt-1" type="checkbox" name="acceptTerms" value="on" required />
          <span>
            Ik heb de voorwaarden en de privacyverklaring gelezen. Die teksten zijn nog niet juridisch beoordeeld.
            Er is geen marketinginschrijving.
          </span>
        </label>
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
