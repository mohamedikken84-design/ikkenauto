import Link from "next/link";
import { Suspense } from "react";
import { AuthForm, Field } from "@/components/auth-form";
import { copyFor } from "@/lib/i18n/auth-copy";
import { getLocale } from "@/lib/i18n/locale";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const locale = await getLocale();
  return pageMetadata({
    title: copyFor(locale).forgotTitle,
    description: copyFor(locale).forgotIntro,
    path: "/account/herstel",
  });
}

export default function RecoveryPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16">…</p>}>
      <RecoveryScreen />
    </Suspense>
  );
}

async function RecoveryScreen() {
  const locale = await getLocale();
  const text = copyFor(locale);
  return (
    <article className="mx-auto w-full max-w-[480px] px-4 py-10">
      <h1 className="font-display text-4xl">{text.forgotTitle}</h1>
      <p className="mt-4 leading-relaxed text-muted">{text.forgotIntro}</p>
      <AuthForm action="/api/auth/recovery" submitLabel={text.sendLink} pendingLabel={text.sendingLink} locale={locale}>
        <Field id="herstel-email" label={text.email} name="email" type="email" autoComplete="email" locale={locale} />
      </AuthForm>
      <p className="mt-4">
        <Link className="inline-flex min-h-11 items-center font-semibold underline decoration-gold decoration-2 underline-offset-4" href="/account/login">
          {text.backLogin}
        </Link>
      </p>
    </article>
  );
}
