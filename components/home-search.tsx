"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { buildHomeSearch, homeSearchYears, resolveHomeModel } from "@/lib/listings/home-search";
import { RADIUS_OPTIONS } from "@/lib/listings/types";

type HomeSearchProps = {
  makes: string[];
  modelsByMake: Record<string, string[]>;
  postcodes: { postalCode: string; city: string }[];
};

const controlClass =
  "mt-2 w-full border border-line bg-paper px-3 py-3 text-base text-ink focus-visible:border-gold-deep";

export function HomeSearch({ makes, modelsByMake, postcodes }: HomeSearchProps) {
  const router = useRouter();
  const formId = useId();
  const errorId = `${formId}-fout`;
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [price, setPrice] = useState("");
  const [year, setYear] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [radius, setRadius] = useState("");
  const [errorField, setErrorField] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const models = make ? (modelsByMake[make] ?? []) : [];
  const known = postcodes.map((entry) => entry.postalCode);
  const built = buildHomeSearch({ make, model, price, year, postalCode, radius }, known);

  function applyError(field: string, message: string) {
    setErrorField(field);
    setErrorMessage(message);
  }

  function clearError() {
    setErrorField(null);
    setErrorMessage("");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!built.ok) {
      applyError(built.error.field, built.error.message);
      return;
    }
    clearError();
    router.push(built.href);
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      aria-describedby={errorMessage ? errorId : undefined}
      aria-labelledby={`${formId}-titel`}
      className="border border-line border-t-4 border-t-gold bg-surface p-5 text-ink md:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-gold-deep uppercase">Voorbeeldcatalogus</p>
          <h2 id={`${formId}-titel`} className="mt-1 font-display text-3xl leading-tight">
            Zoek een auto
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-muted">
          Fictieve voorbeelden, geen live voorraad en geen locatie van dit apparaat.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-semibold" htmlFor={`${formId}-merk`}>
          Merk
          <select
            id={`${formId}-merk`}
            name="merk"
            value={make}
            onChange={(event) => {
              const nextMake = event.target.value;
              setMake(nextMake);
              setModel((current) => resolveHomeModel(nextMake, current, modelsByMake));
              clearError();
            }}
            className={controlClass}
          >
            <option value="">Alle merken</option>
            {makes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold" htmlFor={`${formId}-model`}>
          Model
          <select
            id={`${formId}-model`}
            name="model"
            value={model}
            disabled={!make}
            onChange={(event) => {
              setModel(event.target.value);
              clearError();
            }}
            className={controlClass}
          >
            <option value="">{make ? "Alle modellen" : "Kies eerst een merk"}</option>
            {models.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold" htmlFor={`${formId}-prijs`}>
          Prijs tot
          <input
            id={`${formId}-prijs`}
            name="prijsTot"
            inputMode="numeric"
            autoComplete="off"
            value={price}
            aria-invalid={errorField === "prijsTot"}
            aria-describedby={errorField === "prijsTot" ? errorId : undefined}
            placeholder="bijv. 15.000"
            onChange={(event) => {
              setPrice(event.target.value);
              clearError();
            }}
            className={`${controlClass} placeholder:text-[#a39888]`}
          />
        </label>

        <label className="text-sm font-semibold" htmlFor={`${formId}-jaar`}>
          Bouwjaar vanaf
          <select
            id={`${formId}-jaar`}
            name="jaarVan"
            value={year}
            onChange={(event) => {
              setYear(event.target.value);
              clearError();
            }}
            className={controlClass}
          >
            <option value="">Alle jaren</option>
            {homeSearchYears.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold sm:col-span-1" htmlFor={`${formId}-postcode`}>
          Locatie
          <select
            id={`${formId}-postcode`}
            name="postcode"
            value={postalCode}
            aria-invalid={errorField === "postcode"}
            aria-describedby={errorField === "postcode" ? errorId : undefined}
            onChange={(event) => {
              const next = event.target.value;
              setPostalCode(next);
              if (!next) setRadius("");
              clearError();
            }}
            className={controlClass}
          >
            <option value="">Alle postcodes</option>
            {postcodes.map((entry) => (
              <option key={entry.postalCode} value={entry.postalCode}>
                {entry.postalCode} {entry.city}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold" htmlFor={`${formId}-straal`}>
          Straal
          <select
            id={`${formId}-straal`}
            name="straal"
            value={postalCode ? radius : ""}
            disabled={!postalCode}
            aria-invalid={errorField === "straal"}
            aria-describedby={errorField === "straal" ? errorId : undefined}
            onChange={(event) => {
              setRadius(event.target.value);
              clearError();
            }}
            className={controlClass}
          >
            <option value="">{postalCode ? "Geen straal" : "Kies eerst een postcode"}</option>
            {RADIUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item} km
              </option>
            ))}
          </select>
        </label>
      </div>

      {errorMessage ? (
        <p id={errorId} role="alert" className="mt-4 border border-ink bg-paper px-3 py-2 text-sm">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Link
          href={built.ok ? built.href : "/nl/autos"}
          onClick={(event) => {
            if (!built.ok) {
              event.preventDefault();
              applyError(built.error.field, built.error.message);
            }
          }}
          className="order-2 inline-flex min-h-12 items-center text-sm font-semibold underline decoration-gold decoration-2 underline-offset-4 lg:order-1"
        >
          Alle filters
        </Link>
        <button
          type="submit"
          className="order-1 inline-flex min-h-12 w-full items-center justify-center bg-ink px-6 text-sm font-semibold text-paper transition-colors hover:bg-gold hover:text-ink lg:order-2 lg:w-auto"
        >
          Toon auto&apos;s
        </button>
      </div>
    </form>
  );
}
