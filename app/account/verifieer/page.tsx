import { Suspense } from "react";
import { VerifyAccount } from "@/components/verify-account";
import { copyFor } from "@/lib/i18n/auth-copy";
import { getLocale } from "@/lib/i18n/locale";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const locale = await getLocale();
  return pageMetadata({
    title: copyFor(locale).verifyOkTitle,
    description: copyFor(locale).verifyOkBody,
    path: "/account/verifieer",
  });
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16">…</p>}>
      <VerifyScreen />
    </Suspense>
  );
}

async function VerifyScreen() {
  const locale = await getLocale();
  return (
    <article className="mx-auto w-full max-w-[560px] px-4 py-10">
      <VerifyAccount locale={locale} />
    </article>
  );
}
