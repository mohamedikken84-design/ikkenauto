"use client";

import { useSyncExternalStore } from "react";

const storageKey = "ikkenauto.favorieten";
const changeEvent = "ikkenauto-favorieten";

function subscribe(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(changeEvent, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(changeEvent, handler);
  };
}

function readIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function snapshot() {
  return localStorage.getItem(storageKey) ?? "[]";
}

function serverSnapshot() {
  return "[]";
}

type FavoriteButtonProps = {
  id: string;
  title: string;
  className?: string;
};

export function FavoriteButton({ id, title, className = "" }: FavoriteButtonProps) {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  let saved = false;
  try {
    const parsed = JSON.parse(raw) as unknown;
    saved = Array.isArray(parsed) && parsed.includes(id);
  } catch {
    saved = false;
  }

  function toggle() {
    const current = readIds();
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new Event(changeEvent));
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={toggle}
      className={`inline-flex min-h-10 items-center justify-center border px-3 text-sm font-semibold ${
        saved ? "border-gold bg-gold text-ink" : "border-ink bg-surface text-ink hover:border-gold-deep"
      } ${className}`}
    >
      {saved ? "Bewaard" : "Bewaar"}
      <span className="sr-only"> {title} op dit apparaat</span>
    </button>
  );
}
