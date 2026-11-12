"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { supabaseBrowserConfig } from "@/lib/supabase/env";
import { uploadDealerPhotos } from "@/lib/dealer/photo-batch";

const MAX_UPLOAD = 10;
const MAX_PHOTOS = 25;
const MAX_BYTES = 3_500_000;
const MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export function VehiclePhotoUploader({
  vehicleId, dealerId, currentCount,
}: { vehicleId: string; dealerId: string; currentCount: number }) {
  const router = useRouter();
  const config = useMemo(() => supabaseBrowserConfig(), []);
  const db = useMemo(() => config ? createBrowserClient(config.url, config.anonKey) : null, [config]);
  const fileInput = useRef<HTMLInputElement>(null);
  const [chosen, setChosen] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function choose(files: FileList | null) {
    setChosen(files ? Array.from(files) : []);
    setProgress("");
    setMessage(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!db) { setMessage({ ok:false, text:"Opslag is momenteel niet bereikbaar. Probeer later opnieuw." }); return; }
    if (!chosen.length) { setMessage({ ok:false, text:"Selecteer minstens één foto." }); return; }
    if (chosen.length > MAX_UPLOAD || currentCount + chosen.length > MAX_PHOTOS) {
      setMessage({ ok:false, text:"Selecteer maximaal 10 foto's tegelijk en maximaal 25 per voertuig." }); return;
    }
    if (chosen.some(file => !MIME.has(file.type) || file.size > MAX_BYTES || file.size === 0)) {
      setMessage({ ok:false, text:"Gebruik JPG, PNG of WebP (maximaal 3,5 MB per foto)." }); return;
    }
    setBusy(true);
    setMessage(null);
    let saved = 0;
    const failed: string[] = [];
    try {
      const { data: userResult } = await db.auth.getUser();
      if (!userResult.user) {
        setMessage({ ok:false, text:"Je sessie is verlopen. Meld je opnieuw aan." });
        return;
      }
      const result = await uploadDealerPhotos(db,chosen,dealerId,vehicleId,(complete,total)=>{
        setProgress("Foto's verwerken: "+complete+" van "+total);
      });
      saved=result.saved;
      failed.push(...result.failed);
      setMessage({
        ok: failed.length === 0,
        text: saved + (saved === 1 ? " foto opgeslagen." : " foto's opgeslagen.") +
          (failed.length ? " Niet gelukt: " + failed.slice(0, 3).join(", ") + (failed.length > 3 ? "…" : "") : ""),
      });
      if (saved) {
        setChosen([]);
        if (fileInput.current) fileInput.current.value = "";
        router.refresh();
      }
    } catch {
      setMessage({ ok:false, text:"Er ging iets mis tijdens de upload. Controleer je foto's hieronder en probeer het opnieuw." });
      if (saved) router.refresh();
    } finally {
      setProgress("");
      setBusy(false);
    }
  }

  return <form className="portal-form dealer-photo-upload" onSubmit={event => void submit(event)}>
    <div className="dealer-photo-progress">
      <strong>{currentCount} van {MAX_PHOTOS} foto&apos;s</strong>
      <span>Nog {Math.max(0, MAX_PHOTOS - currentCount)} plaatsen beschikbaar</span>
    </div>
    <label className="dealer-photo-picker">
      <span>Foto&apos;s selecteren</span>
      <input ref={fileInput} name="photo" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy}
        onChange={event => choose(event.target.files)}/>
      <small>Selecteer maximaal 10 foto&apos;s tegelijk, maximaal 3,5 MB per stuk.</small>
    </label>
    {chosen.length > 0 && <div className="dealer-photo-selection" role="status">
      <strong>{chosen.length} geselecteerd</strong>
      <span>{chosen.slice(0, 5).map(file => file.name).join(" · ")}{chosen.length > 5 ? "…" : ""}</span>
    </div>}
    {progress && <p role="status" className="dealer-upload-progress">{progress}</p>}
    {message && <p role="status" className={message.ok ? "portal-form-ok" : "portal-form-error"}>{message.text}</p>}
    <button type="submit" className="portal-button dealer-photo-submit" disabled={busy || !chosen.length || currentCount >= MAX_PHOTOS}>
      {busy ? "Foto's verwerken…" : "Foto's toevoegen"}
    </button>
  </form>;
}
