"use client";
import { useActionState, useState } from "react";
import { dealerChecked } from "./improvements";
import { CompanyLookup } from "./directory-search";
import {parseBelgianEnterpriseNumber} from "@/lib/dealer/kbo";

type CompanySuggestion = { source_row: number; name: string; city: string | null; website: string | null };
export function DealerSetup({ suggestedCompany }: { suggestedCompany?: CompanySuggestion | null }) {
  const [form, setForm] = useState({
    name: suggestedCompany?.name ?? "", city: suggestedCompany?.city ?? "",
    postal_code: "", phone: "", website: suggestedCompany?.website ?? "", kbo_number: "",
  });
  const [selectedRow, setSelectedRow] = useState<number | null>(suggestedCompany?.source_row ?? null);
  const [state, action, pending] = useActionState(dealerChecked, { error: "" });
  function update(name: keyof typeof form, value: string) {
    setForm(previous => ({ ...previous, [name]: value }));
    if (name === "name" || name === "city") setSelectedRow(null);
  }
  const check=form.kbo_number?parseBelgianEnterpriseNumber(form.kbo_number):null;
  const number=form.kbo_number.replace(/\D/g,"").slice(0,10);
  const formatted=number?"BE "+number.slice(0,4)+(number.length>4?"."+number.slice(4,7):"")+(number.length>7?"."+number.slice(7):""):"";
  return <div className="dealer-onboarding">
    <div className="dealer-onboarding-heading">
      <span className="dealer-eyebrow">ACCOUNT INSTELLEN · STAP 2 VAN 3</span>
      <h1>Maak je garageprofiel aan</h1>
      <p>Gebruik je bestaande bedrijfsgegevens of vul ze zelf in. Daarna kun je meteen je voertuigen beheren.</p>
    </div>
    <section className="portal-card portal-setup">
      <div className="dealer-setup-search">
        <div><h2>Staat je garage al in de bedrijvengids?</h2>
          <p>Zoek je garage om de bekende gegevens over te nemen. Een vermelding is nog geen geverifieerd dealeraccount.</p></div>
        <CompanyLookup title="Zoek op garage of gemeente" onClear={() => setSelectedRow(null)}
          onSelect={company => {
            setSelectedRow(company.source_row);
            setForm(current => ({ ...current, name: company.name, city: company.city || current.city, website: company.website || current.website }));
          }}/>
        {selectedRow && <p className="dealer-setup-selected" role="status">Bedrijfsvermelding gekozen. De koppeling wordt afzonderlijk gecontroleerd.</p>}
      </div>
      <div className="dealer-setup-form-heading"><h2>Bedrijfsgegevens</h2><p>Velden met een * zijn verplicht. Je kunt je gegevens later aanvullen.</p></div>
      <form action={action} className="portal-form portal-fields">
        <input type="hidden" name="directory_row" value={selectedRow || ""}/>
        <label>Bedrijfsnaam *<input name="name" value={form.name} onChange={event => update("name", event.target.value)} autoComplete="organization" placeholder="Officiële naam van de garage" required maxLength={140}/></label>
        <label>Gemeente *<input name="city" value={form.city} onChange={event => update("city", event.target.value)} placeholder="Bijv. Mechelen" required maxLength={120}/></label>
        <label>Ondernemingsnummer / BTW-nummer *
          <input name="kbo_number" value={formatted} onChange={event => update("kbo_number", event.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="BE 0123.456.749" aria-describedby="kbo-info" required minLength={9}/>
          <small id="kbo-info">De Belgische controlecijfers worden gecontroleerd. Dit is nog geen officiële live KBO-verificatie.</small>
          {check&&!check.valid&&number.length>=9&&<small role="alert" className="portal-form-error">{check.error}</small>}
        </label>
        <label>Postcode<input name="postal_code" value={form.postal_code} onChange={event => update("postal_code", event.target.value)} placeholder="2800" maxLength={12} autoComplete="postal-code"/></label>
        <label>Telefoon<input name="phone" type="tel" value={form.phone} onChange={event => update("phone", event.target.value)} placeholder="+32 ..." maxLength={40} autoComplete="tel"/></label>
        <label>Website<input name="website" type="url" value={form.website} onChange={event => update("website", event.target.value)} placeholder="https://www.jouwgarage.be" maxLength={250}/></label>
        {state.error && <p role="alert" className="portal-form-error portal-full">{state.error} Je ingevoerde gegevens blijven behouden.</p>}
        <div className="dealer-setup-submit portal-full">
          <span>Je garage wordt niet automatisch publiek gepubliceerd.</span>
          <button className="portal-button" disabled={pending} type="submit">{pending ? "Opslaan…" : "Garage aanmaken en verdergaan →"}</button>
        </div>
      </form>
    </section>
  </div>;
}