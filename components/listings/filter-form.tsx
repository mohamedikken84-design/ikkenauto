"use client";

import type { ChangeEvent, FocusEvent } from "react";
import { useRouter } from "next/navigation";
import { bodyLabel, fuelLabel, sellerLabel, transmissionLabel } from "@/lib/listings/labels";
import { parseFilters, queriesMatch, toAutosHref } from "@/lib/listings/query";
import {
  BODY_TYPES,
  FUELS,
  RADIUS_OPTIONS,
  SELLER_TYPES,
  TRANSMISSIONS,
  type SearchFilters,
} from "@/lib/listings/types";

type FilterFormProps = {
  filters: SearchFilters;
  makes: string[];
  modelsByMake: Record<string, string[]>;
  postcodes: { postalCode: string; city: string }[];
};

const controlClass =
  "mt-2 w-full border border-line bg-paper px-3 py-3 font-normal placeholder:text-[#a39888]";
const years = Array.from({ length: 11 }, (_, index) => 2026 - index);

export function FilterForm({ filters, makes, modelsByMake, postcodes }: FilterFormProps) {
  const router = useRouter();
  const models = filters.make ? (modelsByMake[filters.make] ?? []) : [];
  const allModels = Object.values(modelsByMake).flat();

  function pushFrom(form: HTMLFormElement) {
    const record: Record<string, string> = {};
    for (const [key, value] of new FormData(form).entries()) {
      if (typeof value === "string") record[key] = value;
    }
    const next = parseFilters(record, { makes, models: allModels });
    if (!next.make || (next.model && !(modelsByMake[next.make] ?? []).includes(next.model))) {
      next.model = "";
    }
    const href = toAutosHref(next);
    const current = `${window.location.pathname}${window.location.search}`;
    if (queriesMatch(href, current)) return;
    router.push(href, { scroll: false });
  }

  function onPick(event: ChangeEvent<HTMLSelectElement>) {
    const form = event.currentTarget.form;
    if (form) pushFrom(form);
  }

  function onNumberBlur(event: FocusEvent<HTMLInputElement>) {
    const form = event.currentTarget.form;
    if (form) pushFrom(form);
  }

  return (
    <form
      key={toAutosHref(filters)}
      action="/nl/autos"
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        pushFrom(event.currentTarget);
      }}
      className="border border-line bg-surface p-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl">Filters</h2>
      </div>
      <div className="mt-4 grid gap-4">
        <label className="text-sm font-semibold" htmlFor="filter-merk">
          Merk
          <select id="filter-merk" name="merk" defaultValue={filters.make} onChange={onPick} className={controlClass}>
            <option value="">Alle merken</option>
            {filters.make && !makes.includes(filters.make) ? <option value={filters.make}>{filters.make}</option> : null}
            {makes.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold" htmlFor="filter-model">
          Model
          <select
            id="filter-model"
            name="model"
            defaultValue={filters.model}
            onChange={onPick}
            disabled={!filters.make}
            className={controlClass}
          >
            <option value="">{filters.make ? "Alle modellen" : "Kies eerst een merk"}</option>
            {filters.model && !models.includes(filters.model) ? (
              <option value={filters.model}>{filters.model}</option>
            ) : null}
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          {!filters.make && filters.model ? <input type="hidden" name="model" value={filters.model} /> : null}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-semibold" htmlFor="filter-prijs-van">
            Prijs van
            <input
              id="filter-prijs-van"
              name="prijsVan"
              inputMode="numeric"
              defaultValue={filters.priceMin ?? ""}
              onBlur={onNumberBlur}
              placeholder="optioneel"
              className={controlClass}
            />
          </label>
          <label className="text-sm font-semibold" htmlFor="filter-prijs-tot">
            Prijs tot
            <input
              id="filter-prijs-tot"
              name="prijsTot"
              inputMode="numeric"
              defaultValue={filters.priceMax ?? ""}
              onBlur={onNumberBlur}
              placeholder="optioneel"
              className={controlClass}
            />
          </label>
        </div>
        <label className="text-sm font-semibold" htmlFor="filter-km">
          Kilometer tot
          <input
            id="filter-km"
            name="kmTot"
            inputMode="numeric"
            defaultValue={filters.kmMax ?? ""}
            onBlur={onNumberBlur}
              placeholder="optioneel"
            className={controlClass}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-semibold" htmlFor="filter-jaar-van">
            Jaar van
            <select id="filter-jaar-van" name="jaarVan" defaultValue={filters.yearMin ?? ""} onChange={onPick} className={controlClass}>
              <option value="">Alle</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold" htmlFor="filter-jaar-tot">
            Jaar tot
            <select id="filter-jaar-tot" name="jaarTot" defaultValue={filters.yearMax ?? ""} onChange={onPick} className={controlClass}>
              <option value="">Alle</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="text-sm font-semibold" htmlFor="filter-brandstof">
          Brandstof
          <select id="filter-brandstof" name="brandstof" defaultValue={filters.fuel} onChange={onPick} className={controlClass}>
            <option value="">Alle</option>
            {FUELS.map((fuel) => (
              <option key={fuel} value={fuel}>
                {fuelLabel[fuel]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold" htmlFor="filter-transmissie">
          Transmissie
          <select
            id="filter-transmissie"
            name="transmissie"
            defaultValue={filters.transmission}
            onChange={onPick}
            className={controlClass}
          >
            <option value="">Alle</option>
            {TRANSMISSIONS.map((transmission) => (
              <option key={transmission} value={transmission}>
                {transmissionLabel[transmission]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold" htmlFor="filter-carrosserie">
          Carrosserie
          <select id="filter-carrosserie" name="carrosserie" defaultValue={filters.body} onChange={onPick} className={controlClass}>
            <option value="">Alle</option>
            {BODY_TYPES.map((body) => (
              <option key={body} value={body}>
                {bodyLabel[body]}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-semibold" htmlFor="filter-postcode">
            Postcode
            <input
              id="filter-postcode"
              name="postcode"
              inputMode="numeric"
              list="gekende-postcodes"
              defaultValue={filters.postalCode}
              onBlur={onNumberBlur}
              placeholder="4 cijfers"
              className={controlClass}
            />
          </label>
          <label className="text-sm font-semibold" htmlFor="filter-straal">
            Straal
            <select id="filter-straal" name="straal" defaultValue={filters.radiusKm ?? ""} onChange={onPick} className={controlClass}>
              <option value="">Geen</option>
              {RADIUS_OPTIONS.map((radius) => (
                <option key={radius} value={radius}>
                  {radius} km
                </option>
              ))}
            </select>
          </label>
        </div>
        <datalist id="gekende-postcodes">
          {postcodes.map((entry) => (
            <option key={entry.postalCode} value={entry.postalCode}>
              {entry.city}
            </option>
          ))}
        </datalist>
        <label className="text-sm font-semibold" htmlFor="filter-verkoper">
          Dealer of particulier
          <select id="filter-verkoper" name="verkoper" defaultValue={filters.seller} onChange={onPick} className={controlClass}>
            <option value="">Alle</option>
            {SELLER_TYPES.map((seller) => (
              <option key={seller} value={seller}>
                {sellerLabel[seller]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="submit"
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center bg-ink px-4 text-sm font-semibold text-paper hover:bg-gold hover:text-ink"
      >
        Toon auto&apos;s
      </button>
      <p className="mt-3 text-xs leading-5 text-muted">
        De straal vertrekt vanuit het centrum van een postcode in deze seed, niet vanuit een exact adres.
      </p>
    </form>
  );
}
