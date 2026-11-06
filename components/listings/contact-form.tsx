"use client";

import { useState, type FormEvent } from "react";
import { leadsStorageKey, saveStoredLead, type StoredLead } from "@/lib/listings/browser-store";

type ContactFormProps = {
  listingId: string;
  listingTitle: string;
};

export function ContactForm({ listingId, listingTitle }: ContactFormProps) {
  const [saved, setSaved] = useState<StoredLead | null>(null);
  const [storageError, setStorageError] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const lead: StoredLead = {
      listingId,
      listingTitle,
      name: String(data.get("naam") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("telefoon") ?? "").trim(),
      message: String(data.get("bericht") ?? "").trim(),
      savedAt: new Date().toISOString(),
    };
    const result = saveStoredLead(localStorage, leadsStorageKey, lead);
    if (!result.ok) {
      setSaved(null);
      setStorageError(true);
      return;
    }
    setStorageError(false);
    setSaved(lead);
    form.reset();
  }

  return (
    <form onSubmit={onSubmit} className="border border-line bg-surface p-5" noValidate={false}>
      <h2 className="font-display text-2xl">Contact</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Dit formulier bewaart je bericht alleen in deze browser. Er gaat geen e-mail naar de verkoper
        en er is geen server.
      </p>
      <div className="mt-4 grid gap-4">
        <label className="block text-sm font-semibold" htmlFor={`naam-${listingId}`}>
          Naam
          <input
            id={`naam-${listingId}`}
            name="naam"
            required
            autoComplete="name"
            className="mt-2 w-full border border-line bg-paper px-3 py-3 font-normal"
          />
        </label>
        <label className="block text-sm font-semibold" htmlFor={`email-${listingId}`}>
          E-mail
          <input
            id={`email-${listingId}`}
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-2 w-full border border-line bg-paper px-3 py-3 font-normal"
          />
        </label>
        <label className="block text-sm font-semibold" htmlFor={`telefoon-${listingId}`}>
          Telefoon <span className="font-normal text-muted">(niet verplicht)</span>
          <input
            id={`telefoon-${listingId}`}
            name="telefoon"
            type="tel"
            autoComplete="tel"
            className="mt-2 w-full border border-line bg-paper px-3 py-3 font-normal"
          />
        </label>
        <label className="block text-sm font-semibold" htmlFor={`bericht-${listingId}`}>
          Bericht
          <textarea
            id={`bericht-${listingId}`}
            name="bericht"
            required
            rows={4}
            defaultValue={`Ik heb een vraag over de ${listingTitle}.`}
            className="mt-2 w-full border border-line bg-paper px-3 py-3 font-normal"
          />
        </label>
      </div>
      <button
        type="submit"
        className="mt-4 inline-flex min-h-12 items-center justify-center bg-ink px-5 text-sm font-semibold text-paper hover:bg-gold hover:text-ink"
      >
        Bewaar lokaal
      </button>
      {saved ? (
        <p className="mt-4 border border-gold bg-paper px-4 py-3 text-sm leading-6" role="status">
          Lokaal bewaard op dit apparaat om {formatSavedTime(saved.savedAt)}. Er is geen e-mail
          verstuurd over {saved.listingTitle}.
        </p>
      ) : null}
      {storageError ? (
        <p className="mt-4 border border-ink bg-paper px-4 py-3 text-sm leading-6" role="alert">
          Bewaren lukte niet. Deze browser weigert lokale opslag. Er is niets bewaard en er is geen
          e-mail verstuurd.
        </p>
      ) : null}
    </form>
  );
}

function formatSavedTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
}
