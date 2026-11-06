"use client";

import { useState, type FormEvent } from "react";

const storageKey = "ikkenauto.leads";

type Lead = {
  listingId: string;
  listingTitle: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  savedAt: string;
};

type ContactFormProps = {
  listingId: string;
  listingTitle: string;
};

export function ContactForm({ listingId, listingTitle }: ContactFormProps) {
  const [saved, setSaved] = useState<Lead | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const lead: Lead = {
      listingId,
      listingTitle,
      name: String(data.get("naam") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("telefoon") ?? "").trim(),
      message: String(data.get("bericht") ?? "").trim(),
      savedAt: new Date().toISOString(),
    };
    const current = readLeads();
    localStorage.setItem(storageKey, JSON.stringify([lead, ...current].slice(0, 20)));
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
          Lokaal bewaard op dit apparaat om {saved.savedAt.slice(11, 16)}. Er is geen e-mail
          verstuurd over {saved.listingTitle}.
        </p>
      ) : null}
    </form>
  );
}

function readLeads() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
