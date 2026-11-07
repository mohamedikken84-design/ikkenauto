import { AuthForm, Field } from "@/components/auth-form";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Wachtwoord herstellen",
  description: "Vraag een eenmalig lokaal herstelbericht voor een IKKENAUTO-account.",
  path: "/account/herstel",
});

export default function RecoveryPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl">Wachtwoord herstellen</h1>
      <p className="mt-4 leading-relaxed text-muted">
        Het antwoord is hetzelfde of het adres bekend is of niet. Een bericht gaat alleen naar de lokale testpost.
      </p>
      <AuthForm action="/api/auth/recovery" submitLabel="Herstelbericht vragen">
        <Field id="herstel-email" label="E-mail" name="email" type="email" autoComplete="email" />
      </AuthForm>
    </article>
  );
}
