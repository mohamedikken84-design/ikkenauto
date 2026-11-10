"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { copyFor } from "@/lib/i18n/auth-copy";
import type { Locale } from "@/lib/i18n/locale";

type Copy = ReturnType<typeof copyFor>;
const ErrorContext = createContext<Record<string, string>>({});

type AuthFormProps = {
  action: string;
  submitLabel: string;
  pendingLabel: string;
  locale: Locale;
  children?: ReactNode;
  successHref?: string;
};

export function AuthForm({ action, submitLabel, pendingLabel, locale, children, successHref }: AuthFormProps) {
  const router = useRouter();
  const text = copyFor(locale);
  const [csrf, setCsrf] = useState("");
  const [message, setMessage] = useState("");
  const [alert, setAlert] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/csrf")
      .then((response) => response.json())
      .then((body: { token?: string }) => {
        if (active && body.token) setCsrf(body.token);
      })
      .catch(() => {
        if (active) setAlert(text.csrf);
      });
    return () => {
      active = false;
    };
  }, [text.csrf]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const local = clientErrors(form, data, text);
    if (Object.keys(local).length > 0) {
      setFields(local);
      setAlert(text.alert);
      setMessage("");
      return;
    }
    setPending(true);
    setAlert("");
    setFields({});
    try {
      const response = await fetch(action, {
        method: "POST",
        headers: { "content-type": "application/json", origin: window.location.origin },
        body: JSON.stringify({ ...data, csrf, uiLocale: locale, locale: data.locale ?? locale }),
      });
      const body = (await response.json()) as { message?: string; error?: string; ok?: boolean; next?: string; fields?: Record<string, string> };
      if (!response.ok) {
        setFields(body.fields ?? {});
        setAlert(body.message ?? body.error ?? text.generic);
        return;
      }
      if (action.endsWith("/register")) {
        sessionStorage.setItem("ikken_pending_email", data.email ?? "");
        router.push("/account/bevestig-email");
        return;
      }
      if (body.ok && action.endsWith("/login")) {
        router.push(body.next ?? "/account/voorraad");
        router.refresh();
        return;
      }
      if (body.ok && action.endsWith("/logout")) {
        router.push("/account/login");
        router.refresh();
        return;
      }
      setMessage(body.message ?? "");
      if (successHref) router.prefetch(successHref);
    } catch {
      setAlert(text.network);
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      onBlur={(event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || !target.name || target.type === "hidden" || target.name === "locale") return;
        const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
        const local = clientErrors(event.currentTarget, data, text);
        setFields((current) => {
          const next = { ...current };
          if (local[target.name]) next[target.name] = local[target.name];
          else delete next[target.name];
          return next;
        });
      }}
      className="mt-8 grid gap-4"
      noValidate
    >
      {alert ? (
        <p role="alert" className="border border-ink bg-surface px-3 py-2 text-sm leading-6">
          {alert}
        </p>
      ) : null}
      <ErrorContext.Provider value={fields}>{children}</ErrorContext.Provider>
      <input type="hidden" name="csrf" value={csrf} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 items-center justify-center bg-ink px-5 text-sm font-semibold text-paper hover:bg-gold hover:text-ink disabled:opacity-60 max-sm:sticky max-sm:bottom-6"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
      {message ? (
        <p role="status" className="border border-line bg-surface px-3 py-2 text-sm leading-6">
          {message}
          {successHref ? (
            <>
              {" "}
              <a className="inline-flex min-h-11 items-center font-semibold underline decoration-gold decoration-2 underline-offset-4" href={successHref}>
                {text.toLogin}
              </a>
            </>
          ) : null}
        </p>
      ) : null}
    </form>
  );
}

function clientErrors(form: HTMLFormElement, data: Record<string, string>, text: Copy) {
  const fields: Record<string, string> = {};
  if (form.querySelector('[name="displayName"]')) {
    const name = (data.displayName ?? "").trim();
    if (!name || name.length > 80) fields.displayName = text.nameInvalid;
  }
  if (form.querySelector('[name="email"]') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((data.email ?? "").trim())) fields.email = text.emailInvalid;
  if (form.querySelector('[name="password"]') && (data.password ?? "").length < 12) fields.password = text.passwordShort;
  if (form.querySelector('[name="passwordConfirm"]') && data.passwordConfirm !== data.password) fields.passwordConfirm = text.passwordMismatch;
  if (form.querySelector('[name="tradeName"]')) {
    const trade = (data.tradeName ?? "").trim();
    if (!trade || trade.length > 120) fields.tradeName = text.tradeInvalid;
  }
  if (form.querySelector('[name="kboNumber"]')) {
    const kbo = (data.kboNumber ?? "").replace(/[\s.]/g, "");
    if (!/^\d{10}$/.test(kbo)) fields.kboNumber = text.kboInvalid;
  }
  if (form.querySelector('[name="vatNumber"]')) {
    const vat = (data.vatNumber ?? "").replace(/[\s.]/g, "").toUpperCase();
    if (!/^BE[01]\d{9}$/.test(vat)) fields.vatNumber = text.vatInvalid;
  }
  if (form.querySelector('[name="postalCode"]') && !/^\d{4}$/.test(data.postalCode ?? "")) fields.postalCode = text.postcodeInvalid;
  if (form.querySelector('[name="city"]') && !(data.city ?? "").trim()) fields.city = text.cityInvalid;
  if (form.querySelector('[name="acceptTerms"]') && data.acceptTerms !== "on") fields.acceptTerms = text.termsError;
  return fields;
}

export function TermsField({ id, children }: { id: string; children: ReactNode }) {
  const error = useContext(ErrorContext).acceptTerms;
  return (
    <div>
      <label className="flex min-h-11 items-start gap-3 text-sm leading-6" htmlFor={id}>
        <input
          id={id}
          className="mt-1 size-5"
          type="checkbox"
          name="acceptTerms"
          value="on"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span>{children}</span>
      </label>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Field({
  id,
  label,
  name,
  type = "text",
  autoComplete,
  required = true,
  inputMode,
  hint,
  locale = "nl",
}: {
  id: string;
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  inputMode?: "numeric" | "text" | "email";
  hint?: string;
  locale?: Locale;
}) {
  const errors = useContext(ErrorContext);
  const error = errors[name];
  const text = copyFor(locale);
  const [visible, setVisible] = useState(false);
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  const inputType = type === "password" && visible ? "text" : type;
  return (
    <div>
      <label className="text-sm font-semibold" htmlFor={id}>
        {label}
        <input
          id={id}
          name={name}
          type={inputType}
          autoComplete={autoComplete}
          required={required}
          inputMode={inputMode}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`mt-2 min-h-12 w-full border bg-paper px-3 py-3 text-base font-normal ${error ? "border-ink" : "border-line"}`}
        />
      </label>
      {type === "password" ? (
        <button
          type="button"
          className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold underline decoration-gold decoration-2 underline-offset-4"
          aria-label={visible ? text.hidePassword : text.showPassword}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? text.hidePassword : text.showPassword}
        </button>
      ) : null}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
