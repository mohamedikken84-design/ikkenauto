import Link from "next/link";
import { Suspense } from "react";
import { AuthForm, Field } from "@/components/auth-form";
import { copyFor } from "@/lib/i18n/auth-copy";
import { getLocale } from "@/lib/i18n/locale";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const locale = await getLocale();
  return pageMetadata({
    title: locale === "fr" ? "Se connecter" : "Aanmelden",
    description: copyFor(locale).loginIntro,
    path: "/account/login",
  });
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16">…</p>}>
      <LoginScreen />
    </Suspense>
  );
}

async function LoginScreen() {
  const locale = await getLocale();
  const text = copyFor(locale);
  return (
    <article className="mx-auto w-full max-w-[480px] px-4 py-10">
      <h1 className="font-display text-4xl">{text.loginTitle}</h1>
      <p className="mt-4 leading-relaxed text-muted">{text.loginIntro}</p>
      <AuthForm action="/api/auth/login" submitLabel={text.login} pendingLabel={text.loggingIn} locale={locale}>
        <Field id="login-email" label={text.email} name="email" type="email" autoComplete="email" locale={locale} />
        <Field id="login-wachtwoord" label={text.password} name="password" type="password" autoComplete="current-password" locale={locale} />
      </AuthForm>
      <ul className="mt-6 grid gap-1 text-sm font-semibold">
        <li>
          <Link className="inline-flex min-h-11 items-center underline decoration-gold decoration-2 underline-offset-4" href="/account/herstel">
            {text.forgot}
          </Link>
        </li>
        <li>
          <Link className="inline-flex min-h-11 items-center underline decoration-gold decoration-2 underline-offset-4" href="/account/registreren">
            {text.noAccount}
          </Link>
        </li>
      </ul>
      <p className="text-sm text-muted">{text.loginHint}</p>
    </article>
  );
}
