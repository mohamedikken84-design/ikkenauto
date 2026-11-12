"use client";

import { useActionState, useState } from "react";
import { vehicleChecked } from "./improvements";
import { vehicleMakes, suggestedModels } from "@/lib/dealer/vehicle-catalog";

const fuels = ["Benzine", "Diesel", "Elektrisch", "Hybride", "Plug-in hybride", "LPG", "CNG", "Waterstof", "Overig"];
const transmissions = ["Automaat", "Manueel", "Semi-automaat"];
const bodyTypes = ["SUV", "Berline", "Hatchback", "Break", "Coupé", "Cabrio", "Monovolume", "Bestelwagen", "Pick-up", "Andere"];
const equipmentGroups = [
  { title: "Comfort", values: ["Airconditioning", "Automatische klimaatregeling", "Verwarmde zetels", "Elektrische zetels", "Lederen bekleding", "Keyless entry", "Elektrische achterklep", "Panoramadak"] },
  { title: "Veiligheid", values: ["Cruisecontrol", "Adaptieve cruisecontrol", "Achteruitrijcamera", "360° camera", "Parkeersensoren voor", "Parkeersensoren achter", "Dodehoekwaarschuwing", "Rijstrookassistent", "Isofix"] },
  { title: "Multimedia & exterieur", values: ["Navigatie", "Apple CarPlay", "Android Auto", "Bluetooth", "Head-updisplay", "Ledkoplampen", "Matrix-led", "Lichtmetalen velgen", "Sportpakket", "Trekhaak"] },
];
const steps = ["Basisgegevens", "Kenmerken", "Uitrusting", "Controleren"];
const optionalFields = [
  "version", "fuel", "transmission", "body_type", "condition", "seats", "doors", "power_hp",
  "emission_class", "color", "interior_color", "drivetrain", "first_registration", "vin", "source_ref", "description"
];

export function VehicleEditor() {
  const [result, submitVehicle, pending] = useActionState(vehicleChecked, { error: "" });
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [vatDeductible, setVatDeductible] = useState(false);
  const [validation, setValidation] = useState("");

  function change(name: string, value: string) {
    setValues(previous => ({
      ...previous,
      [name]: value,
      ...(name === "make" && previous.make !== value ? { model: "" } : {}),
    }));
    setValidation("");
  }
  function field(name: string, label: string, placeholder = "", type = "text", required = false, extra?: string) {
    return <label className="dealer-form-field" key={name}>
      <span>{label}{required && <b aria-hidden="true"> *</b>}</span>
      <input
        type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        value={values[name] ?? ""}
        onChange={event => change(name, event.target.value)}
        placeholder={placeholder}
        aria-required={required}
        min={type === "number" ? "0" : undefined}
      />
      {extra && <small>{extra}</small>}
    </label>;
  }
  function selectField(name: string, label: string, options: readonly string[]) {
    return <label className="dealer-form-field" key={name}>
      <span>{label}</span>
      <select value={values[name] ?? ""} onChange={event => change(name, event.target.value)}>
        <option value="">Kies een optie</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>;
  }
  function next() {
    if (step === 0) {
      const price = Number(values.price_eur ?? "");
      const year = Number(values.year ?? "");
      const mileage = Number(values.mileage_km ?? "");
      if (!(values.make ?? "").trim() || !(values.model ?? "").trim()) {
        setValidation("Vul het merk en model in."); return;
      }
      if (!Number.isFinite(price) || price <= 0 || price > 100000000) {
        setValidation("Vul een geldige verkoopprijs in."); return;
      }
      if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1 || !(values.year ?? "").trim()) {
        setValidation("Controleer het bouwjaar."); return;
      }
      if (!Number.isInteger(mileage) || mileage < 0 || mileage > 5000000 || !(values.mileage_km ?? "").trim()) {
        setValidation("Controleer de kilometerstand."); return;
      }
    }
    setValidation("");
    setStep(current => Math.min(3, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function previous() {
    setValidation("");
    setStep(current => Math.max(0, current - 1));
  }
  function toggleOption(option: string, checked: boolean) {
    setSelectedOptions(current => checked ? [...current, option] : current.filter(value => value !== option));
  }
  const formatted = (name: string) => values[name]?.trim() || "Niet ingevuld";
  return <div className="dealer-wizard">
    <div className="dealer-wizard-top">
      <div>
        <span className="dealer-eyebrow">VOERTUIG TOEVOEGEN</span>
        <h1>Een auto aan je voorraad toevoegen</h1>
        <p>Vul je autogegevens in. Je kunt ze later altijd aanpassen.</p>
      </div>
      <div className="dealer-wizard-counter">Stap {step + 1} van {steps.length}</div>
    </div>
    <ol className="dealer-wizard-progress" aria-label="Voortgang">
      {steps.map((title, index) => <li key={title} aria-current={index === step ? "step" : undefined} className={index === step ? "active" : index < step ? "complete" : ""}>
        <span className="dealer-step-index">{index < step ? "✓" : index + 1}</span>
        <span>{title}</span>
      </li>)}
    </ol>

    <div className="dealer-wizard-main">
      {step === 0 && <section aria-labelledby="vehicle-base-title">
        <div className="dealer-wizard-section-heading"><h2 id="vehicle-base-title">Basisgegevens</h2><p>Begin met de belangrijkste gegevens van de auto.</p></div>
        <div className="dealer-form-grid">
          <label className="dealer-form-field"><span>Merk <b aria-hidden="true">*</b></span>
            <input list="dealer-wizard-makes" value={values.make ?? ""} onChange={event => change("make", event.target.value)} placeholder="Bijv. Volkswagen" autoComplete="off" aria-required="true"/>
            <datalist id="dealer-wizard-makes">{vehicleMakes.map(make => <option key={make} value={make}/>)}</datalist>
            <small>Typ een merk of kies uit de suggesties.</small>
          </label>
          <label className="dealer-form-field"><span>Model <b aria-hidden="true">*</b></span>
            <input list="dealer-wizard-models" value={values.model ?? ""} onChange={event => change("model", event.target.value)} placeholder="Bijv. Golf" autoComplete="off" aria-required="true"/>
            <datalist id="dealer-wizard-models">{suggestedModels(values.make).map(model => <option key={model} value={model}/>)}</datalist>
            <small>Ook andere modellen kun je invullen.</small>
          </label>
          {field("version", "Uitvoering", "Bijv. GTI, M Sport of AMG Line")}
          {field("year", "Bouwjaar", "Bijv. 2022", "number", true)}
          {field("mileage_km", "Kilometerstand (km)", "Bijv. 58500", "number", true)}
          {field("price_eur", "Verkoopprijs (€)", "Bijv. 19990", "number", true)}
        </div>
      </section>}
      {step === 1 && <section aria-labelledby="vehicle-spec-title">
        <div className="dealer-wizard-section-heading"><h2 id="vehicle-spec-title">Kenmerken</h2><p>Deze gegevens helpen kopers om de juiste auto te vinden. Je mag ze ook later invullen.</p></div>
        <div className="dealer-form-grid">
          {selectField("fuel", "Brandstof", fuels)}
          {selectField("transmission", "Versnellingsbak", transmissions)}
          {selectField("body_type", "Carrosserie", bodyTypes)}
          {selectField("condition", "Staat", ["Nieuw", "Tweedehands", "Demowagen", "Oldtimer", "Schadevoertuig"])}
          {field("power_hp", "Vermogen (pk)", "Bijv. 150", "number")}
          {selectField("emission_class", "Emissieklasse", ["Euro 6e", "Euro 6d", "Euro 6", "Euro 5", "Euro 4", "Euro 3", "Elektrisch / n.v.t."])}
          {selectField("color", "Buitenkleur", ["Zwart", "Wit", "Grijs", "Zilver", "Blauw", "Rood", "Groen", "Bruin", "Beige", "Goud", "Andere"])}
          {selectField("interior_color", "Interieurkleur", ["Zwart", "Grijs", "Beige", "Bruin", "Andere"])}
          {selectField("drivetrain", "Aandrijving", ["Voorwielaandrijving", "Achterwielaandrijving", "Vierwielaandrijving"])}
          {selectField("seats", "Zitplaatsen", ["2", "3", "4", "5", "6", "7", "8", "9"])}
          {selectField("doors", "Aantal deuren", ["2", "3", "4", "5", "6"])}
          {field("first_registration", "Eerste inschrijving", "MM/JJJJ")}
          {field("vin", "Chassisnummer (VIN)", "17 tekens")}
          {field("source_ref", "Eigen stocknummer", "Bijv. GARAGE-001")}
        </div>
      </section>}
      {step === 2 && <section aria-labelledby="vehicle-options-title">
        <div className="dealer-wizard-section-heading"><h2 id="vehicle-options-title">Uitrusting en beschrijving</h2><p>Kies wat aanwezig is. Alle opties zijn facultatief.</p></div>
        {equipmentGroups.map(group => <fieldset className="dealer-equipment-group" key={group.title}>
          <legend>{group.title}</legend>
          <div className="dealer-equipment-grid">{group.values.map(option => <label key={option} className="dealer-equipment-option">
            <input type="checkbox" checked={selectedOptions.includes(option)} onChange={event => toggleOption(option, event.target.checked)}/>
            <span>{option}</span>
          </label>)}</div>
        </fieldset>)}
        <label className="dealer-form-field dealer-description-field"><span>Omschrijving</span>
          <textarea rows={5} value={values.description ?? ""} onChange={event => change("description", event.target.value)} placeholder="Vertel meer over de onderhoudshistoriek, staat en bijzonderheden van de auto." maxLength={4000}/>
        </label>
        <label className="dealer-equipment-option dealer-vat-option"><input type="checkbox" checked={vatDeductible} onChange={event => setVatDeductible(event.target.checked)}/><span>BTW aftrekbaar</span></label>
      </section>}
      {step === 3 && <section aria-labelledby="vehicle-review-title">
        <div className="dealer-wizard-section-heading"><h2 id="vehicle-review-title">Controleer de gegevens</h2><p>Alles juist? Sla de auto op. Daarna kun je foto&apos;s toevoegen.</p></div>
        <div className="dealer-review-list">
          <div><span>Voertuig</span><strong>{formatted("make")} {formatted("model")}</strong></div>
          <div><span>Uitvoering</span><strong>{formatted("version")}</strong></div>
          <div><span>Bouwjaar</span><strong>{formatted("year")}</strong></div>
          <div><span>Kilometerstand</span><strong>{formatted("mileage_km")} km</strong></div>
          <div><span>Verkoopprijs</span><strong>{values.price_eur ? "€ " + Number(values.price_eur).toLocaleString("nl-BE") : "Niet ingevuld"}</strong></div>
          <div><span>Brandstof</span><strong>{formatted("fuel")}</strong></div>
          <div><span>Versnellingsbak</span><strong>{formatted("transmission")}</strong></div>
          <div><span>Uitrusting</span><strong>{selectedOptions.length} geselecteerde opties</strong></div>
        </div>
        <div className="dealer-note-box"><strong>Wat gebeurt er na het opslaan?</strong><p>Deze auto wordt als concept opgeslagen in je privévoorraad. In de volgende stap kun je foto&apos;s uploaden. De advertentie wordt niet automatisch gepubliceerd.</p></div>
        <form action={submitVehicle} id="dealer-wizard-submit">
          {["make", "model", "year", "mileage_km", "price_eur", ...optionalFields].map(name => <input key={name} type="hidden" name={name} value={values[name] ?? ""}/>)}
          {selectedOptions.map(option => <input key={option} type="hidden" name="options" value={option}/>)}
          {vatDeductible && <input type="hidden" name="vat_deductible" value="on"/>}
          {result.error && <p role="alert" className="portal-form-error">{result.error} Alle ingevoerde gegevens zijn behouden.</p>}
        </form>
      </section>}
      {validation && <p role="alert" className="portal-form-error dealer-wizard-error">{validation}</p>}
      <div className="dealer-wizard-actions">
        {step > 0 ? <button type="button" className="dealer-button-secondary" onClick={previous} disabled={pending}>Vorige</button> : <span className="dealer-wizard-helper">* Verplicht veld</span>}
        {step < 3 ? <button type="button" className="portal-button dealer-wizard-next" onClick={next}>Volgende stap <span aria-hidden="true">→</span></button>
          : <button type="submit" form="dealer-wizard-submit" className="portal-button dealer-wizard-next" disabled={pending}>{pending ? "Auto opslaan…" : "Opslaan en foto's toevoegen"}</button>}
      </div>
    </div>
  </div>;
}