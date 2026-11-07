import Link from "next/link";
import { AuthForm, Field } from "@/components/auth-form";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Aanmelden",
  description: "Meld je lokaal aan bij IKKENAUTO.be. Geen productie-identiteitsprovider.",
  path: "/account/login",
});

export default function LoginPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16">
      <p className="text-xs font-semibold tracking-[0.16em] text-gold-deep uppercase">Lokaal account</p>
      <h1 className="mt-3 font-display text-4xl">Aanmelden</h1>
      <p className="mt-4 leading-relaxed text-muted">
        Dit is een lokale testaanmelding. Ontwikkeltokens uit een script zijn geen gebruikerslogin.
      </p>
      <AuthForm action="/api/auth/login" submitLabel="Aanmelden">
        <Field id="login-email" label="E-mail" name="email" type="email" autoComplete="email" />
        <Field id="login-wachtwoord" label="Wachtwoord" name="password" type="password" autoComplete="current-password" />
      </AuthForm>
      <ul className="mt-6 grid gap-2 text-sm font-semibold">
        <li>
          <Link className="underline decoration-gold decoration-2 underline-offset-4" href="/account/registreren">
            Registreren
          </Link>
        </li>
        <li>
          <Link className="underline decoration-gold decoration-2 underline-offset-4" href="/account/herstel">
            Wachtwoord herstellen
          </Link>
        </li>
      </ul>
    </article>
  );
}
