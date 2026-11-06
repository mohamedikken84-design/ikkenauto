"use client";

import { useRouter } from "next/navigation";

export function BackToResults() {
  const router = useRouter();

  function goBack() {
    const referrer = document.referrer;
    if (referrer) {
      try {
        const previous = new URL(referrer);
        if (previous.origin === window.location.origin && previous.pathname === "/nl/autos") {
          router.back();
          return;
        }
      } catch {
        // Een onleesbare referrer valt terug op de volledige lijst.
      }
    }
    router.push("/nl/autos");
  }

  return (
    <button type="button" onClick={goBack} className="text-sm font-semibold text-ink underline decoration-gold decoration-2 underline-offset-4">
      Terug naar resultaten
    </button>
  );
}
