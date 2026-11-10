import Link from "next/link";
import { Suspense } from "react";
import { ResendForm } from "@/components/resend-form";
import { copyFor } from "@/lib/i18n/auth-copy";
import { getLocale } from "@/lib/i18n/locale";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const locale = await getLocale();
  return pageMetadata({
    title: copyFor(locale).checkTitle,
    description: copyFor(locale).checkBody,
    path: "/account/bevestig-email",
  });
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16">…</p>}>
      <CheckEmailScreen />
    </Suspense>
  );
}

async function CheckEmailScreen() {
  const locale = await getLocale();
  const text = copyFor(locale);
  return (
    <article className="mx-auto w-full max-w-[560px] px-4 py-10">
      <h1 className="font-display text-4xl">{text.checkTitle}</h1>
      <p className="mt-4 leading-relaxed">{text.checkBody}</p>
      <p className="mt-3 text-sm text-muted">{text.spam}</p>
      <ResendForm locale={locale} />
      <p className="mt-6">
        <Link className="inline-flex min-h-11 items-center font-semibold underline decoration-gold decoration-2 underline-offset-4" href="/account/login">
          {text.backLogin}
        </Link>
      </p>
    </article>
  );
}
