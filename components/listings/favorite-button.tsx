"use client";

import { useState, useSyncExternalStore } from "react";
import { favoritesStorageKey, readStringList, toggleStoredId } from "@/lib/listings/browser-store";

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

function snapshot() {
  return localStorage.getItem(favoritesStorageKey) ?? "[]";
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
  const [storageError, setStorageError] = useState(false);
  let saved = false;
  try {
    saved = readStringList({ getItem: () => raw, setItem: () => undefined }, "snapshot").includes(id);
  } catch {
    saved = false;
  }

  function toggle() {
    const result = toggleStoredId(localStorage, favoritesStorageKey, id);
    if (!result.ok) {
      setStorageError(true);
      return;
    }
    setStorageError(false);
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
      {storageError ? "Niet bewaard" : saved ? "Bewaard" : "Bewaar"}
      <span className="sr-only">
        {" "}
        {title} op dit apparaat{storageError ? ". De browser weigerde lokale opslag." : ""}
      </span>
    </button>
  );
}
