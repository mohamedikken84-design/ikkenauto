import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "E-mail bevestigen",
  description: "Bevestig een lokaal IKKENAUTO-account met een eenmalig token.",
  path: "/account/verifieer",
});

export default function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <Suspense fallback={<p className="px-4 py-16">Bevestiging laden…</p>}>
      <VerifyScreen searchParams={searchParams} />
    </Suspense>
  );
}

async function VerifyScreen({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token ?? "";
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl">Adres bevestigen</h1>
      <p className="mt-4 leading-relaxed text-muted">
        De link uit de lokale testpost vult het token in. Het token wordt niet in een log geschreven.
      </p>
      <AuthForm action="/api/auth/verify" submitLabel="Bevestigen">
        <label className="text-sm font-semibold" htmlFor="verify-token">
          Token
          <input
            id="verify-token"
            name="token"
            defaultValue={token}
            autoComplete="one-time-code"
            required
            className="mt-2 w-full border border-line bg-paper px-3 py-3 font-normal"
          />
        </label>
      </AuthForm>
    </article>
  );
}
