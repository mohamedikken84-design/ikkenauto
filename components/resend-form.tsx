"use client";

import { useEffect, useState } from "react";
import { copyFor } from "@/lib/i18n/auth-copy";
import type { Locale } from "@/lib/i18n/locale";

const cooldownSeconds = 30;

export function ResendForm({ locale }: { locale: Locale }) {
  const text = copyFor(locale);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [alert, setAlert] = useState("");
  const [left, setLeft] = useState(0);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const tick = () => {
      setEmail(sessionStorage.getItem("ikken_pending_email") ?? "");
      const until = Number(sessionStorage.getItem("ikken_resend_until") ?? "0");
      setLeft(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    };
    const start = setTimeout(tick, 0);
    const timer = setInterval(tick, 500);
    return () => {
      clearTimeout(start);
      clearInterval(timer);
    };
  }, []);

  async function resend() {
    setPending(true);
    setAlert("");
    try {
      const csrfResponse = await fetch("/api/auth/csrf");
      const csrfBody = (await csrfResponse.json()) as { token?: string };
      const response = await fetch("/api/auth/verify/resend", {
        method: "POST",
        headers: { "content-type": "application/json", origin: window.location.origin },
        body: JSON.stringify({ email, csrf: csrfBody.token ?? "" }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setAlert(body.message ?? text.generic);
        return;
      }
      sessionStorage.setItem("ikken_pending_email", email);
      sessionStorage.setItem("ikken_resend_until", String(Date.now() + cooldownSeconds * 1000));
      setLeft(cooldownSeconds);
      setMessage(body.message ?? "");
    } catch {
      setAlert(text.network);
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="mt-8 grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (left === 0) void resend();
      }}
    >
      {alert ? <p role="alert" className="border border-ink px-3 py-2 text-sm">{alert}</p> : null}
      <label className="text-sm font-semibold" htmlFor="resend-email">
        {text.email}
        <input
          id="resend-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 min-h-12 w-full border border-line bg-paper px-3 py-3 text-base font-normal"
        />
      </label>
      <button type="submit" disabled={pending || left > 0} className="inline-flex min-h-12 items-center justify-center bg-ink px-5 text-sm font-semibold text-paper disabled:opacity-60">
        {pending ? text.resending : left > 0 ? `${text.resend} (${left})` : text.resend}
      </button>
      {message ? <p role="status" className="text-sm leading-6">{message}</p> : null}
    </form>
  );
}
