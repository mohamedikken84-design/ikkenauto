import Link from "next/link";
import { Suspense } from "react";
import { AuthForm, Field } from "@/components/auth-form";
import { copyFor } from "@/lib/i18n/auth-copy";
import { getLocale } from "@/lib/i18n/locale";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const locale = await getLocale();
  const text = copyFor(locale);
  return pageMetadata({
    title: locale === "fr" ? "Créer un compte – IKKENAUTO" : "Account aanmaken – IKKENAUTO",
    description: text.registerIntro,
    path: "/account/registreren",
  });
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16">…</p>}>
      <RegisterScreen />
    </Suspense>
  );
}

async function RegisterScreen() {
  const locale = await getLocale();
  const text = copyFor(locale);
  return (
    <article className="mx-auto w-full max-w-[640px] px-4 py-10">
      <h1 className="font-display text-4xl">{text.registerTitle}</h1>
      <p className="mt-4 leading-relaxed text-muted">{text.registerIntro}</p>
      <AuthForm action="/api/auth/register" submitLabel={text.create} pendingLabel={text.creating} locale={locale}>
        <input type="hidden" name="kind" value="professioneel" />
        <fieldset className="grid gap-4">
          <legend className="text-sm font-semibold">{text.sectionYou}</legend>
          <Field id="reg-naam" label={text.name} name="displayName" autoComplete="name" locale={locale} />
          <Field id="reg-email" label={text.email} name="email" type="email" autoComplete="email" locale={locale} />
          <Field id="reg-wachtwoord" label={text.password} name="password" type="password" autoComplete="new-password" hint={text.passwordHint} locale={locale} />
          <Field id="reg-wachtwoord-2" label={text.password2} name="passwordConfirm" type="password" autoComplete="new-password" locale={locale} />
        </fieldset>
        <fieldset className="grid gap-4">
          <legend className="text-sm font-semibold">{text.sectionGarage}</legend>
          <Field id="reg-handelsnaam" label={text.tradeName} name="tradeName" autoComplete="organization" locale={locale} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="reg-kbo" label={text.kbo} name="kboNumber" inputMode="numeric" hint={text.kboHint} locale={locale} />
            <Field id="reg-btw" label={text.vat} name="vatNumber" hint={text.vatHint} locale={locale} />
            <Field id="reg-postcode" label={text.postcode} name="postalCode" autoComplete="postal-code" inputMode="numeric" locale={locale} />
            <Field id="reg-plaats" label={text.city} name="city" autoComplete="address-level2" locale={locale} />
          </div>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold">{text.portalLanguage}</legend>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="radio" name="locale" value="nl" defaultChecked={locale === "nl"} />
              {text.dutch}
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="radio" name="locale" value="fr" defaultChecked={locale === "fr"} />
              {text.french}
            </label>
          </fieldset>
        </fieldset>
        <label className="flex min-h-11 items-start gap-3 text-sm leading-6">
          <input className="mt-1 size-5" type="checkbox" name="acceptTerms" value="on" />
          <span>
            {locale === "fr" ? (
              <>
                J&apos;ai lu les <Link className="underline" href="/voorwaarden">conditions</Link> et la{" "}
                <Link className="underline" href="/privacy">politique de confidentialité</Link> et je les accepte.
              </>
            ) : (
              <>
                Ik heb de <Link className="underline" href="/voorwaarden">voorwaarden</Link> en de{" "}
                <Link className="underline" href="/privacy">privacyverklaring</Link> gelezen en ga ermee akkoord.
              </>
            )}
          </span>
        </label>
      </AuthForm>
      <p className="mt-4 text-sm">
        <Link className="inline-flex min-h-11 items-center font-semibold underline decoration-gold decoration-2 underline-offset-4" href="/account/login">
          {text.haveAccount}
        </Link>
      </p>
    </article>
  );
}
