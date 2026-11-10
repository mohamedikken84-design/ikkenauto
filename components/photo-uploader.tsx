"use client";

import { useState } from "react";

export function PhotoUploader({ vehicleId }: { vehicleId: string }) {
  const [message, setMessage] = useState("");

  async function upload(file: File) {
    const image = await compressToWebp(file);
    const form = new FormData();
    form.set("file", image, "foto.webp");
    const response = await fetch(`/api/dealer/stock/${vehicleId}/photos`, { method: "POST", body: form });
    const body = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Foto opgeslagen." : (body.error ?? "Upload mislukt."));
  }

  return (
    <div
      className="border border-dashed border-line p-4"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) void upload(file);
      }}
    >
      <label className="text-sm font-semibold" htmlFor="photo-file">
        Sleep een foto hierheen of kies een bestand. De browser maakt er WebP van, maximaal 5 MB en hoogstens 20.
        <input
          id="photo-file"
          className="mt-3 block w-full text-base"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </label>
      {message ? <p role="status" className="mt-3 text-sm">{message}</p> : null}
    </div>
  );
}

async function compressToWebp(file: File) {
  if (typeof createImageBitmap !== "function") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.8));
  if (!blob) return file;
  return new File([blob], "foto.webp", { type: "image/webp" });
}
