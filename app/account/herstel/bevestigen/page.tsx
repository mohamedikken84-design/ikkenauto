import { Suspense } from "react";
import { AuthForm, Field } from "@/components/auth-form";
import { copyFor } from "@/lib/i18n/auth-copy";
import { getLocale } from "@/lib/i18n/locale";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const locale = await getLocale();
  return pageMetadata({
    title: copyFor(locale).newPasswordTitle,
    description: copyFor(locale).newPasswordIntro,
    path: "/account/herstel/bevestigen",
  });
}

export default function RecoveryConfirmPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16">…</p>}>
      <RecoveryConfirmScreen />
    </Suspense>
  );
}

async function RecoveryConfirmScreen() {
  const locale = await getLocale();
  const text = copyFor(locale);
  return (
    <article className="mx-auto w-full max-w-[480px] px-4 py-10">
      <h1 className="font-display text-4xl">{text.newPasswordTitle}</h1>
      <p className="mt-4 leading-relaxed text-muted">{text.newPasswordIntro}</p>
      <AuthForm action="/api/auth/recovery/confirm" submitLabel={text.savePassword} pendingLabel={text.savingPassword} locale={locale} successHref="/account/login">
        <Field id="nieuw-wachtwoord" label={text.newPassword} name="password" type="password" autoComplete="new-password" hint={text.passwordHint} locale={locale} />
        <Field id="nieuw-wachtwoord-2" label={text.password2} name="passwordConfirm" type="password" autoComplete="new-password" locale={locale} />
      </AuthForm>
    </article>
  );
}
