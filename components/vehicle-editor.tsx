"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createAutosave } from "@/lib/dealer/autosave";
import { publicationLabel } from "@/lib/dealer/labels";
import type { DealerVehicle, PublicationStatus } from "@/lib/dealer/types";

const fuels = ["benzine", "diesel", "hybride", "elektrisch", "lpg"];
const transmissions = ["manueel", "automaat"];
const bodies = ["berline", "break", "suv", "hatchback", "coupe", "cabrio", "monovolume"];
const vat = ["marge", "btw-aftrekbaar", "incl-btw", "particulier"];

type EditorProps = {
  vehicle: DealerVehicle | null;
};

export function VehicleEditor({ vehicle }: EditorProps) {
  const router = useRouter();
  const [status, setStatus] = useState(vehicle?.publicationStatus ?? "draft");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const idRef = useRef(vehicle?.id ?? "");

  const persist = useCallback(async (nextStatus: PublicationStatus, quiet: boolean) => {
    const form = formRef.current;
    if (!form) return;
    const data = Object.fromEntries(new FormData(form).entries());
    const equipment = String(data.equipment ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const body = {
      ...data,
      priceEur: Number(data.priceEur),
      mileageKm: Number(data.mileageKm),
      powerKw: Number(data.powerKw),
      doors: data.doors ? Number(data.doors) : null,
      seats: data.seats ? Number(data.seats) : null,
      co2Gkm: data.co2Gkm ? Number(data.co2Gkm) : null,
      warrantyMonths: data.warrantyMonths ? Number(data.warrantyMonths) : null,
      previousOwners: data.previousOwners ? Number(data.previousOwners) : null,
      equipment,
      publicationStatus: nextStatus,
    };
    setSaving(true);
    const response = await fetch(idRef.current ? `/api/dealer/stock/${idRef.current}` : "/api/dealer/stock", {
      method: idRef.current ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { vehicle?: { id: string }; error?: string };
    setSaving(false);
    if (!response.ok || !payload.vehicle) {
      setMessage(payload.error ?? "Opslaan lukte niet.");
      return;
    }
    idRef.current = payload.vehicle.id;
    setStatus(nextStatus);
    if (!quiet) setMessage(nextStatus === "archived" ? "Auto gearchiveerd." : "Concept opgeslagen.");
    if (!vehicle && !quiet) router.replace(`/account/voorraad/${payload.vehicle.id}`);
  }, [router, vehicle]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const autosave = createAutosave(1500, () => {
      if (status !== "draft") return;
      void persist("draft", true);
    });
    const onInput = () => {
      if (status === "draft") autosave.schedule();
    };
    form.addEventListener("input", onInput);
    return () => {
      form.removeEventListener("input", onInput);
      autosave.cancel();
    };
  }, [persist, status]);

  async function removeVehicle() {
    if (!idRef.current) return;
    const response = await fetch(`/api/dealer/stock/${idRef.current}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("Verwijderen lukte niet.");
      return;
    }
    router.push("/account/voorraad");
    router.refresh();
  }

  return (
    <form ref={formRef} className="mt-8 grid gap-4" onSubmit={(event) => event.preventDefault()}>
      <p className="text-sm text-muted">Status: {publicationLabel(status)}. Een concept wordt automatisch bewaard.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Merk" name="make" defaultValue={vehicle?.make} required />
        <Field label="Model" name="model" defaultValue={vehicle?.model} required />
        <Field label="Uitvoering" name="version" defaultValue={vehicle?.version} />
        <Field label="Eerste inschrijving" name="firstRegistration" defaultValue={vehicle?.firstRegistration} placeholder="2020-03" required />
        <Field label="Kilometerstand" name="mileageKm" defaultValue={vehicle ? String(vehicle.mileageKm) : ""} required />
        <Field label="Vermogen (kW)" name="powerKw" defaultValue={vehicle ? String(vehicle.powerKw) : ""} required />
        <Select label="Brandstof" name="fuel" options={fuels} defaultValue={vehicle?.fuel} />
        <Select label="Transmissie" name="transmission" options={transmissions} defaultValue={vehicle?.transmission} />
        <Select label="Carrosserie" name="body" options={bodies} defaultValue={vehicle?.body} />
        <Field label="Kleur" name="color" defaultValue={vehicle?.color ?? ""} />
        <Field label="Deuren" name="doors" defaultValue={vehicle?.doors ? String(vehicle.doors) : ""} />
        <Field label="Zitplaatsen" name="seats" defaultValue={vehicle?.seats ? String(vehicle.seats) : ""} />
        <Field label="CO2 (g/km)" name="co2Gkm" defaultValue={vehicle?.co2Gkm != null ? String(vehicle.co2Gkm) : ""} />
        <Field label="Euronorm" name="euroNorm" defaultValue={vehicle?.euroNorm ?? ""} />
        <Field label="Prijs (euro)" name="priceEur" defaultValue={vehicle ? String(vehicle.priceEur) : ""} required />
        <Select label="Btw-regime" name="vatRegime" options={vat} defaultValue={vehicle?.vatRegime} />
        <Field label="Garantie (maanden)" name="warrantyMonths" defaultValue={vehicle?.warrantyMonths != null ? String(vehicle.warrantyMonths) : ""} />
        <Field label="Keuring geldig tot" name="inspectionValidUntil" defaultValue={vehicle?.inspectionValidUntil ?? ""} placeholder="2027-06-01" />
        <Field label="Vorige eigenaars" name="previousOwners" defaultValue={vehicle?.previousOwners != null ? String(vehicle.previousOwners) : ""} />
        <Field label="Postcode" name="postalCode" defaultValue={vehicle?.postalCode} required />
        <Field label="Gemeente" name="city" defaultValue={vehicle?.city} required />
      </div>
      <label className="text-sm font-semibold" htmlFor="equipment">
        Uitrusting, gescheiden door komma’s
        <input id="equipment" name="equipment" defaultValue={vehicle?.equipment.join(", ") ?? ""} className="mt-2 w-full border border-line bg-paper px-3 py-3 text-base font-normal" />
      </label>
      <label className="text-sm font-semibold" htmlFor="descriptionNl">
        Beschrijving Nederlands
        <textarea id="descriptionNl" name="descriptionNl" defaultValue={vehicle?.descriptionNl ?? ""} rows={4} className="mt-2 w-full border border-line bg-paper px-3 py-3 text-base font-normal" />
      </label>
      <label className="text-sm font-semibold" htmlFor="descriptionFr">
        Description français
        <textarea id="descriptionFr" name="descriptionFr" defaultValue={vehicle?.descriptionFr ?? ""} rows={4} className="mt-2 w-full border border-line bg-paper px-3 py-3 text-base font-normal" />
      </label>
      <fieldset className="grid gap-4 border border-line p-4">
        <legend className="px-1 text-sm font-semibold">Niet zichtbaar op de site</legend>
        <Field label="VIN" name="vin" defaultValue={vehicle?.vin ?? ""} />
        <Field label="Kenteken" name="licensePlate" defaultValue={vehicle?.licensePlate ?? ""} />
      </fieldset>
      <input type="hidden" name="description" value={vehicle?.description ?? ""} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" className="min-h-12 bg-ink px-5 text-sm font-semibold text-paper" onClick={() => void persist("draft", false)}>
          {saving ? "Opslaan…" : "Concept opslaan"}
        </button>
        <button type="button" className="min-h-12 border border-ink px-5 text-sm font-semibold" onClick={() => void persist("archived", false)}>
          Archiveren
        </button>
        {vehicle ? (
          <button type="button" className="min-h-12 border border-ink px-5 text-sm font-semibold" onClick={() => setConfirmDelete(true)}>
            Auto verwijderen
          </button>
        ) : null}
      </div>
      {confirmDelete ? (
        <div className="border border-ink p-4" role="alertdialog" aria-labelledby="verwijder-titel">
          <h2 id="verwijder-titel" className="font-semibold">Deze auto verwijderen?</h2>
          <p className="mt-2 text-sm">{vehicle?.make} {vehicle?.model} verdwijnt uit uw voorraad. Dit kunt u niet ongedaan maken.</p>
          <div className="mt-4 flex gap-3">
            <button type="button" className="min-h-12 bg-ink px-5 text-sm font-semibold text-paper" onClick={() => void removeVehicle()}>
              Verwijderen
            </button>
            <button type="button" className="min-h-12 border border-ink px-5 text-sm font-semibold" onClick={() => setConfirmDelete(false)}>
              Annuleren
            </button>
          </div>
        </div>
      ) : null}
      {message ? <p role="status" className="text-sm">{message}</p> : null}
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="text-sm font-semibold" htmlFor={name}>
      {label}
      <input
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full border border-line bg-paper px-3 py-3 text-base font-normal"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
}) {
  return (
    <label className="text-sm font-semibold" htmlFor={name}>
      {label}
      <select id={name} name={name} defaultValue={defaultValue || options[0]} className="mt-2 w-full border border-line bg-paper px-3 py-3 text-base font-normal">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
