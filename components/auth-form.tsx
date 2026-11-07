"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

type AuthFormProps = {
  action: string;
  submitLabel: string;
  children?: ReactNode;
};

export function AuthForm({ action, submitLabel, children }: AuthFormProps) {
  const router = useRouter();
  const [csrf, setCsrf] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/csrf")
      .then((response) => response.json())
      .then((body: { token?: string }) => {
        if (active && body.token) setCsrf(body.token);
      })
      .catch(() => {
        if (active) setMessage("De beveiligingstoken kon niet geladen worden.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const response = await fetch(action, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: window.location.origin,
        "x-csrf-token": csrf,
      },
      body: JSON.stringify({ ...data, csrf }),
    });
    const body = (await response.json()) as { message?: string; error?: string; ok?: boolean };
    if (response.ok && body.ok && action.endsWith("/login")) {
      router.push("/account");
      router.refresh();
      return;
    }
    if (response.ok && body.ok && action.endsWith("/logout")) {
      router.push("/account/login");
      router.refresh();
      return;
    }
    setMessage(body.message ?? body.error ?? "Er ging iets mis.");
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid max-w-xl gap-4">
      {children}
      <input type="hidden" name="csrf" value={csrf} />
      <button
        type="submit"
        className="inline-flex min-h-12 items-center justify-center bg-ink px-5 text-sm font-semibold text-paper hover:bg-gold hover:text-ink"
      >
        {submitLabel}
      </button>
      {message ? (
        <p role="status" className="border border-ink bg-surface px-3 py-2 text-sm leading-6">
          {message}
        </p>
      ) : null}
    </form>
  );
}

export function Field({
  id,
  label,
  name,
  type = "text",
  autoComplete,
  required = true,
}: {
  id: string;
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-semibold" htmlFor={id}>
      {label}
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="mt-2 w-full border border-line bg-paper px-3 py-3 font-normal"
      />
    </label>
  );
}
