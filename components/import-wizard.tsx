"use client";

import { useState } from "react";

type Preview = {
  fatal: string | null;
  rows: { lineNumber: number; sourceStockId: string; status: string; errors: string[] }[];
};

export function ImportWizard() {
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");

  async function loadFile(file: File) {
    const text = await file.text();
    setCsv(text);
    const response = await fetch("/api/dealer/import/preview", {
      method: "POST",
      headers: { "content-type": "text/csv" },
      body: text,
    });
    setPreview((await response.json()) as Preview);
  }

  async function confirmImport() {
    const response = await fetch("/api/dealer/import", {
      method: "POST",
      headers: { "content-type": "text/csv" },
      body: csv,
    });
    const body = (await response.json()) as { applied?: number; invalid?: number; error?: string };
    setMessage(response.ok ? `${body.applied ?? 0} concepten opgeslagen, ${body.invalid ?? 0} rijen overgeslagen.` : (body.error ?? "Import mislukt."));
  }

  return (
    <div className="mt-8 grid gap-4">
      <label className="text-sm font-semibold" htmlFor="csv-file">
        CSV-bestand
        <input id="csv-file" className="mt-2 block w-full text-base" type="file" accept=".csv,text/csv" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void loadFile(file);
        }} />
      </label>
      {preview?.fatal ? <p role="alert">{preview.fatal}</p> : null}
      {preview && !preview.fatal ? (
        <>
          <p>{preview.rows.filter((row) => row.status !== "invalid").length} geldige rijen, {preview.rows.filter((row) => row.status === "invalid").length} met fouten.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left">Rij</th>
                  <th className="p-2 text-left">Bron</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.lineNumber} className="border-t border-line">
                    <td className="p-2">{row.lineNumber}</td>
                    <td className="p-2">{row.sourceStockId}</td>
                    <td className="p-2">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="min-h-12 bg-ink px-5 text-sm font-semibold text-paper" onClick={() => void confirmImport()}>
            Import bevestigen
          </button>
        </>
      ) : null}
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
