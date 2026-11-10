"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ResendForm } from "@/components/resend-form";
import { copyFor } from "@/lib/i18n/auth-copy";
import type { Locale } from "@/lib/i18n/locale";

export function VerifyAccount({ locale }: { locale: Locale }) {
  const text = copyFor(locale);
  const [state, setState] = useState<"loading" | "ok" | "bad">("loading");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    let active = true;
    const start = setTimeout(() => {
      void (async () => {
        if (!token) {
          if (active) setState("bad");
          return;
        }
        try {
          const csrfResponse = await fetch("/api/auth/csrf");
          const csrfBody = (await csrfResponse.json()) as { token?: string };
          const response = await fetch("/api/auth/verify", {
            method: "POST",
            headers: { "content-type": "application/json", origin: window.location.origin },
            body: JSON.stringify({ token, csrf: csrfBody.token ?? "" }),
          });
          if (active) setState(response.ok ? "ok" : "bad");
        } catch {
          if (active) setState("bad");
        }
      })();
    }, 0);
    return () => {
      active = false;
      clearTimeout(start);
    };
  }, []);

  if (state === "loading") return <p className="mt-6 text-lg">{text.verifyLoading}</p>;
  if (state === "ok") {
    return (
      <div className="mt-6 grid gap-4">
        <h1 className="font-display text-4xl">{text.verifyOkTitle}</h1>
        <p role="status">{text.verifyOkBody}</p>
        <Link className="inline-flex min-h-12 items-center justify-center bg-ink px-5 text-sm font-semibold text-paper" href="/account/login">
          {text.toLogin}
        </Link>
      </div>
    );
  }
  return (
    <div className="mt-6">
      <h1 className="font-display text-4xl">{text.verifyBadTitle}</h1>
      <p role="alert" className="mt-4">{text.verifyBadBody}</p>
      <ResendForm locale={locale} />
    </div>
  );
}
