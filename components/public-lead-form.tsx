"use client";

import { useState, type FormEvent } from "react";

export function PublicLeadForm({ vehicleId }: { vehicleId: string }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    setPending(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, vehicleId, consent: data.consent === "on" }),
      });
      const body = (await response.json()) as { message?: string };
      setMessage(response.ok ? "Uw bericht is verstuurd." : (body.message ?? "Versturen lukte niet."));
    } catch {
      setMessage("De verbinding is verbroken. Probeer opnieuw.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-3 border border-line p-4">
      <h2 className="font-display text-2xl">Vraag over deze auto</h2>
      <label className="text-sm font-semibold" htmlFor="lead-name">
        Naam
        <input id="lead-name" name="name" required className="mt-2 min-h-12 w-full border border-line px-3 text-base" />
      </label>
      <label className="text-sm font-semibold" htmlFor="lead-email">
        E-mailadres
        <input id="lead-email" name="email" type="email" autoComplete="email" required className="mt-2 min-h-12 w-full border border-line px-3 text-base" />
      </label>
      <label className="text-sm font-semibold" htmlFor="lead-message">
        Bericht
        <textarea id="lead-message" name="message" required rows={4} className="mt-2 w-full border border-line px-3 py-3 text-base" />
      </label>
      <label className="flex min-h-11 items-start gap-3 text-sm">
        <input type="checkbox" name="consent" value="on" required className="mt-1 size-5" />
        <span>Ik ga ermee akkoord dat de garage contact met mij opneemt over deze auto.</span>
      </label>
      <input className="hidden" tabIndex={-1} autoComplete="off" name="company" aria-hidden="true" />
      <button type="submit" disabled={pending} className="min-h-12 bg-ink px-5 text-sm font-semibold text-paper">
        {pending ? "Versturen…" : "Bericht versturen"}
      </button>
      {message ? <p role="status" className="text-sm">{message}</p> : null}
    </form>
  );
}
