"use client";

import { useState } from "react";

const statuses = [
  ["new", "Nieuw"],
  ["in_progress", "In behandeling"],
  ["won", "Gewonnen"],
  ["lost", "Verloren"],
  ["spam", "Spam"],
] as const;

export function LeadStatusForm({ leadId, status }: { leadId: string; status: string }) {
  const [current, setCurrent] = useState(status);
  const [message, setMessage] = useState("");

  async function save(next: string) {
    setCurrent(next);
    const response = await fetch(`/api/dealer/leads/${leadId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setMessage(response.ok ? "Status bijgewerkt." : "Bijwerken lukte niet.");
  }

  return (
    <form className="mt-6 grid gap-3" onSubmit={(event) => event.preventDefault()}>
      <label className="text-sm font-semibold" htmlFor="lead-status">
        Status
        <select id="lead-status" className="mt-2 min-h-12 w-full border border-line px-3 text-base" value={current} onChange={(event) => void save(event.target.value)}>
          {statuses.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {message ? <p role="status" className="text-sm">{message}</p> : null}
    </form>
  );
}
