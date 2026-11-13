"use client";

import { useEffect, useMemo, useState } from "react";

type Pane = "dashboard" | "inventory" | "vehicle" | "company";
type Status = "draft" | "ready" | "sold";
type Vehicle = {
  id: string; make: string; model: string; version: string; year: string;
  mileage: string; price: string; fuel: string; transmission: string;
  body: string; condition: string; power: string; drivetrain: string;
  emission: string; doors: string; seats: string; color: string;
  interior: string; vin: string; description: string; warranty: string;
  vat: boolean; equipment: string[]; status: Status;
};
type Company = { name: string; vat: string; email: string; phone: string; street: string; zip: string; city: string; website: string; about: string };

const emptyVehicle: Vehicle = {
  id: "", make: "", model: "", version: "", year: "", mileage: "", price: "",
  fuel: "", transmission: "", body: "", condition: "", power: "",
  drivetrain: "", emission: "", doors: "", seats: "", color: "",
  interior: "", vin: "", description: "", warranty: "", vat: false,
  equipment: [], status: "draft"
};
const demoVehicles: Vehicle[] = [
  { ...emptyVehicle, id: "demo-1", make: "BMW", model: "320d Touring", version: "M Sport", year: "2022", mileage: "45200", price: "34990", fuel: "Diesel", transmission: "Automaat", status: "ready" },
  { ...emptyVehicle, id: "demo-2", make: "Mercedes-Benz", model: "GLC 220 d", version: "AMG Line", year: "2021", mileage: "61950", price: "41900", fuel: "Diesel", transmission: "Automaat", status: "ready" },
  { ...emptyVehicle, id: "demo-3", make: "Audi", model: "A3 Sportback", version: "35 TFSI", year: "2023", mileage: "18800", price: "28950", fuel: "Benzine", transmission: "Automaat", status: "draft" },
  { ...emptyVehicle, id: "demo-4", make: "Volkswagen", model: "Golf", version: "1.5 eTSI", year: "2020", mileage: "79500", price: "21450", fuel: "Benzine", transmission: "Automaat", status: "sold" }
];
const equipment = [
  "Airconditioning", "Automatische klimaatregeling", "Navigatiesysteem", "Apple CarPlay",
  "Android Auto", "Achteruitrijcamera", "Parkeersensoren voor", "Parkeersensoren achter",
  "Adaptieve cruisecontrol", "Dodehoekassistent", "Lane assist", "LED-koplampen",
  "Matrix LED", "Panoramadak", "Lederen bekleding", "Verwarmde zetels",
  "Elektrische zetels", "Keyless entry", "Trekhaak", "Sportpakket",
  "Digitale cockpit", "Bluetooth", "DAB+", "360° camera"
];
const makes = ["Audi", "BMW", "Citroën", "Cupra", "Dacia", "Fiat", "Ford", "Hyundai", "Kia", "Land Rover", "Lexus", "Mazda", "Mercedes-Benz", "MINI", "Nissan", "Opel", "Peugeot", "Porsche", "Renault", "Škoda", "Tesla", "Toyota", "Volkswagen", "Volvo"];
const number = new Intl.NumberFormat("nl-BE");
const euro = new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const statusLabel: Record<Status, string> = { draft: "Concept", ready: "Klaar", sold: "Verkocht" };

const iconPaths: Record<string, string> = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  car: "M5 11l2-5h10l2 5 M4 17h16v-6H4z M6 17v2 M18 17v2 M7.5 14h.01 M16.5 14h.01",
  plus: "M12 5v14 M5 12h14",
  building: "M4 21V5l8-3 8 3v16 M9 21v-5h6v5 M8 9h.01 M12 9h.01 M16 9h.01 M8 12h.01 M12 12h.01 M16 12h.01",
  search: "M21 21l-4.5-4.5 M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  back: "M19 12H5 M11 18l-6-6 6-6",
  menu: "M4 7h16 M4 12h16 M4 17h16",
  close: "M5 5l14 14 M19 5L5 19",
  check: "M4 12l5 5 11-11",
  edit: "M4 20l4.5-1 11-11-3.5-3.5-11 11L4 20z M14 6l3.5 3.5",
  trash: "M4 7h16 M10 4h4 M7 7l1 13h8l1-13 M10 11v6 M14 11v6",
  link: "M10 13a5 5 0 0 0 7 .5l2-2a5 5 0 1 0-7-7l-1.5 1.5 M14 11a5 5 0 0 0-7-.5l-2 2a5 5 0 1 0 7 7l1.5-1.5",
  upload: "M12 16V4 M7 9l5-5 5 5 M4 16v4h16v-4",
  shield: "M12 2l8 4v6c0 5-3 8-8 10-5-2-8-5-8-10V6l8-4z M9 12l2 2 4-4",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  filter: "M4 7h16 M7 12h10 M10 17h4",
  info: "M12 17v-5 M12 8h.01 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  clock: "M12 6v6l4 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z"
};
function Icon({ name, size = 19 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={iconPaths[name] || iconPaths.grid} /></svg>;
}
function Mark() {
  return <span className="wordmark" aria-label="IKKENAUTO">I<span className="gold-k">K</span>KENAUTO<span className="wordmark-period">.</span></span>;
}
function CarGlyph() { return <span className="vehicle-glyph"><Icon name="car" size={26}/></span>; }
function StatusChip({ status }: { status: Status }) { return <span className={"status status-" + status}><span className="status-dot" />{statusLabel[status]}</span>; }
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { return <label className="field"><span className="field-label">{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
function PanelTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <div className="section-heading"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>;
}

export default function DealerPortal() {
  const [pane, setPane] = useState<Pane>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>(demoVehicles);
  const [draft, setDraft] = useState<Vehicle>(emptyVehicle);
  const [company, setCompany] = useState<Company>({ name: "", vat: "", email: "", phone: "", street: "", zip: "", city: "", website: "", about: "" });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [flash, setFlash] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [photoNames, setPhotoNames] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedVehicles = window.localStorage.getItem("ikkenauto-v2-preview-vehicles");
      const storedCompany = window.localStorage.getItem("ikkenauto-v2-preview-company");
      if (storedVehicles) { const parsed: unknown = JSON.parse(storedVehicles); if (Array.isArray(parsed)) setVehicles(parsed as Vehicle[]); }
      if (storedCompany) setCompany(JSON.parse(storedCompany) as Company);
    } catch { /* Preview still works without storage. */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) { try { window.localStorage.setItem("ikkenauto-v2-preview-vehicles", JSON.stringify(vehicles)); } catch { /* storage not available */ } } }, [vehicles, loaded]);
  useEffect(() => { if (loaded) { try { window.localStorage.setItem("ikkenauto-v2-preview-company", JSON.stringify(company)); } catch { /* storage not available */ } } }, [company, loaded]);

  const visible = useMemo(() => vehicles.filter(v => (filter === "all" || v.status === filter) && (v.make + " " + v.model + " " + v.version).toLowerCase().includes(query.toLowerCase())), [vehicles, query, filter]);
  const ready = vehicles.filter(v => v.status === "ready").length;
  const draftCount = vehicles.filter(v => v.status === "draft").length;
  const sold = vehicles.filter(v => v.status === "sold").length;
  function navigate(next: Pane) { setPane(next); setMenuOpen(false); setFlash(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function newVehicle() { setDraft({ ...emptyVehicle }); setPhotoNames([]); navigate("vehicle"); }
  function editVehicle(v: Vehicle) { setDraft({ ...v, equipment: [...v.equipment] }); setPhotoNames([]); navigate("vehicle"); }
  function updateDraft<K extends keyof Vehicle>(key: K, value: Vehicle[K]) { setDraft(prev => ({ ...prev, [key]: value })); }
  function notify(message: string) { setFlash(message); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function saveVehicle(status: Status) {
    if (!draft.make.trim() || !draft.model.trim() || !draft.price || Number(draft.price) < 0) { notify("Vul minstens merk, model en een geldige prijs in."); return; }
    const saved: Vehicle = { ...draft, id: draft.id || "preview-" + Date.now().toString(), status };
    setVehicles(old => [saved, ...old.filter(v => v.id !== saved.id)]);
    navigate("inventory");
    setFlash("Voertuig lokaal opgeslagen in de ontwerppreview. Er is niets naar Supabase verstuurd.");
  }
  function removeVehicle(id: string) {
    if (window.confirm("Dit voertuig uit de lokale preview verwijderen?")) {
      setVehicles(old => old.filter(v => v.id !== id));
      setFlash("Voertuig verwijderd uit de lokale preview.");
    }
  }

  return <div className="portal-app">
    {menuOpen && <button className="nav-scrim" onClick={() => setMenuOpen(false)} aria-label="Sluit navigatie" />}
    <aside className={"sidebar " + (menuOpen ? "sidebar-open" : "")}>
      <div className="sidebar-brand"><Mark/><button className="mobile-close icon-button" aria-label="Sluit menu" onClick={() => setMenuOpen(false)}><Icon name="close"/></button></div>
      <div className="sidebar-small-label">DEALERPORTAAL</div>
      <nav className="side-nav" aria-label="Portaal navigatie">
        <button onClick={() => navigate("dashboard")} className={pane === "dashboard" ? "nav-active" : ""}><Icon name="grid"/> Overzicht</button>
        <button onClick={() => navigate("inventory")} className={pane === "inventory" ? "nav-active" : ""}><Icon name="car"/> Mijn voertuigen <span className="nav-count">{vehicles.length}</span></button>
        <button onClick={newVehicle} className={pane === "vehicle" ? "nav-active" : ""}><Icon name="plus"/> Voertuig toevoegen</button>
        <button onClick={() => navigate("company")} className={pane === "company" ? "nav-active" : ""}><Icon name="building"/> Bedrijfsprofiel</button>
      </nav>
      <div className="sidebar-bottom">
        <div className="side-note"><span className="side-note-icon"><Icon name="shield" size={17}/></span><div><strong>Je nieuwe werkruimte.</strong><p>Ontworpen voor autohandelaars, zonder overbodige functies.</p></div></div>
        <div className="sidebar-account"><span className="avatar">IA</span><span><strong>IKKENAUTO demo</strong><small>Ontwerpomgeving</small></span><span className="account-dots">•••</span></div>
      </div>
    </aside>
    <div className="workarea">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Icon name="menu"/></button><span className="breadcrumb">Dealerportaal <span>/</span> <strong>{pane === "dashboard" ? "Overzicht" : pane === "inventory" ? "Mijn voertuigen" : pane === "vehicle" ? (draft.id ? "Voertuig bewerken" : "Voertuig toevoegen") : "Bedrijfsprofiel"}</strong></span><div className="topbar-right"><span className="preview-indicator"><span /> Ontwerppreview</span><span className="avatar avatar-small">IA</span></div></header>
      <main className="content">
        <div className="preview-banner"><Icon name="info" size={17}/><span><strong>Ontwerppreview:</strong> alle zichtbare voertuigen zijn voorbeelden of lokaal opgeslagen. Er worden geen echte account- of voertuiggegevens gewijzigd.</span></div>
        {flash && <div className="notice" role="status"><Icon name="info" size={18}/><span>{flash}</span><button aria-label="Sluit melding" onClick={() => setFlash("")}><Icon name="close" size={16}/></button></div>}

        {pane === "dashboard" && <>
          <section className="hero-heading"><div><div className="eyebrow">WELKOM BIJ IKKENAUTO</div><h1>Goed overzicht. Meer controle.</h1><p>Beheer je autovoorraad op één rustige, overzichtelijke plek.</p></div><button className="button-primary" onClick={newVehicle}><Icon name="plus" size={18}/> Voertuig toevoegen</button></section>
          <div className="stats-grid">
            <div className="stat"><span>Voertuigen in totaal</span><strong>{number.format(vehicles.length)}</strong><small>In deze preview</small></div>
            <div className="stat"><span>Klaar voor publicatie</span><strong>{number.format(ready)}</strong><small><span className="mini-dot positive"/> Klaar</small></div>
            <div className="stat"><span>Concepten</span><strong>{number.format(draftCount)}</strong><small>Nog aan te vullen</small></div>
            <div className="stat"><span>Verkocht</span><strong>{number.format(sold)}</strong><small>Historiek</small></div>
          </div>
          <div className="dashboard-grid">
            <section className="panel recent-panel"><div className="panel-head"><div><h2>Recente voertuigen</h2><p>Je laatst bewerkte advertenties</p></div><button className="text-action" onClick={() => navigate("inventory")}>Bekijk alles <Icon name="arrow" size={15}/></button></div>
              {vehicles.length ? <div className="recent-list">{vehicles.slice(0, 5).map(v => <button key={v.id} className="recent-row" onClick={() => editVehicle(v)}><CarGlyph/><span className="recent-name"><strong>{v.make} {v.model}</strong><small>{v.version || "Geen uitvoering"} · {v.year || "Bouwjaar onbekend"} · {v.mileage ? number.format(Number(v.mileage)) + " km" : "Geen kilometerstand"}</small></span><span className="recent-price">{euro.format(Number(v.price || 0))}</span><StatusChip status={v.status}/></button>)}</div> : <div className="empty-small">Nog geen voertuigen. <button onClick={newVehicle}>Voeg je eerste auto toe</button>.</div>}
            </section>
            <section className="panel getting-started"><span className="eyebrow">JE STARTPUNT</span><h2>Alles klaar voor een frisse start.</h2><p>Vul je bedrijfsprofiel aan en voeg je eerste voertuigen toe. Zo ontstaat een sterke basis voor de latere lancering.</p><div className="check-list"><span><Icon name="check" size={15}/> Accountomgeving ontworpen</span><span><Icon name="check" size={15}/> Voertuigbeheer als preview</span><span className="pending"><Icon name="clock" size={15}/> Koppeling met Supabase volgt</span></div><button className="button-secondary" onClick={() => navigate("company")}>Bedrijfsprofiel bekijken <Icon name="arrow" size={16}/></button></section>
          </div>
        </>}

        {pane === "inventory" && <>
          <section className="page-heading"><div><span className="eyebrow">VOORRAADBEHEER</span><h1>Mijn voertuigen</h1><p>Beheer, bewerk en organiseer je volledige voorraad.</p></div><button className="button-primary" onClick={newVehicle}><Icon name="plus" size={18}/> Voertuig toevoegen</button></section>
          <div className="inventory-panel panel">
            <div className="inventory-toolbar"><div className="search-wrap"><Icon name="search" size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Zoek op merk, model of uitvoering" aria-label="Zoek voertuigen"/></div><div className="filter-tabs" aria-label="Filter op status">{[["all", "Alle"], ["ready", "Klaar"], ["draft", "Concept"], ["sold", "Verkocht"]].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={filter === value ? "filter-active" : ""}>{label}</button>)}</div></div>
            <div className="table-scroll"><table className="vehicle-table"><thead><tr><th>Voertuig</th><th>Specificaties</th><th>Vraagprijs</th><th>Status</th><th className="table-actions">Acties</th></tr></thead><tbody>{visible.map(v => <tr key={v.id}><td><div className="table-car"><CarGlyph/><div><strong>{v.make} {v.model}</strong><small>{v.version || "Uitvoering nog in te vullen"}</small></div></div></td><td className="spec-cell">{v.year || "—"} · {v.mileage ? number.format(Number(v.mileage)) + " km" : "—"}<small>{v.fuel || "Brandstof onbekend"} · {v.transmission || "Transmissie onbekend"}</small></td><td className="table-price">{euro.format(Number(v.price || 0))}</td><td><StatusChip status={v.status}/></td><td><div className="row-actions"><button title="Bewerken" aria-label={"Bewerk " + v.make + " " + v.model} onClick={() => editVehicle(v)}><Icon name="edit" size={18}/></button><button title="Verwijderen" aria-label={"Verwijder " + v.make + " " + v.model} onClick={() => removeVehicle(v.id)}><Icon name="trash" size={18}/></button></div></td></tr>)}</tbody></table></div>
            {!visible.length && <div className="empty-state"><span className="empty-icon"><Icon name="car" size={30}/></span><h3>Geen voertuigen gevonden</h3><p>Pas je zoekopdracht aan of voeg een voertuig toe.</p><button className="button-secondary" onClick={newVehicle}>Voertuig toevoegen</button></div>}
            <div className="table-footer">{visible.length} van {vehicles.length} voertuigen <span>Previewvoorraad · Alleen lokaal</span></div>
          </div>
        </>}

        {pane === "vehicle" && <>
          <section className="page-heading form-page-heading"><div><button className="back-link" onClick={() => navigate("inventory")}><Icon name="back" size={16}/> Terug naar voertuigen</button><span className="eyebrow">VOERTUIGBEHEER</span><h1>{draft.id ? "Voertuig bewerken" : "Voertuig toevoegen"}</h1><p>Alle gegevens op één pagina. Vul in wat je weet; je kunt later verder aanvullen.</p></div></section>
          <div className="form-layout">
            <div className="form-main">
              <section className="form-panel panel"><PanelTitle eyebrow="01 / BASIS" title="Basisgegevens" description="Begin bij het merk, model en de belangrijkste kenmerken van het voertuig."/><div className="form-grid">
                <Field label="Merk *"><select value={draft.make} onChange={e => updateDraft("make", e.target.value)}><option value="">Selecteer een merk</option>{makes.map(m => <option key={m}>{m}</option>)}</select></Field>
                <Field label="Model *"><input value={draft.model} placeholder="bv. 320d Touring" onChange={e => updateDraft("model", e.target.value)}/></Field>
                <Field label="Uitvoering"><input value={draft.version} placeholder="bv. M Sport" onChange={e => updateDraft("version", e.target.value)}/></Field>
                <Field label="Bouwjaar"><input type="number" min="1900" max="2100" value={draft.year} placeholder="2023" onChange={e => updateDraft("year", e.target.value)}/></Field>
                <Field label="Kilometerstand"><div className="input-suffix"><input type="number" min="0" value={draft.mileage} placeholder="0" onChange={e => updateDraft("mileage", e.target.value)}/><span>km</span></div></Field>
                <Field label="Carrosserie"><select value={draft.body} onChange={e => updateDraft("body", e.target.value)}><option value="">Selecteer</option>{["Berline", "Break", "SUV", "Hatchback", "Coupé", "Cabriolet", "Monovolume", "Bestelwagen", "Pick-up"].map(x => <option key={x}>{x}</option>)}</select></Field>
                <Field label="Staat"><select value={draft.condition} onChange={e => updateDraft("condition", e.target.value)}><option value="">Selecteer</option><option>Nieuw</option><option>Tweedehands</option><option>Demo</option></select></Field>
                <Field label="VIN / chassisnummer"><input maxLength={17} value={draft.vin} placeholder="17 tekens" onChange={e => updateDraft("vin", e.target.value.toUpperCase())}/></Field>
              </div></section>
              <section className="form-panel panel"><PanelTitle eyebrow="02 / TECHNIEK" title="Technische gegevens" description="De specificaties die kopers het vaakst gebruiken om te vergelijken."/><div className="form-grid">
                <Field label="Brandstof"><select value={draft.fuel} onChange={e => updateDraft("fuel", e.target.value)}><option value="">Selecteer</option>{["Benzine", "Diesel", "Elektrisch", "Hybride", "Plug-in hybride", "LPG", "CNG", "Waterstof"].map(x => <option key={x}>{x}</option>)}</select></Field>
                <Field label="Transmissie"><select value={draft.transmission} onChange={e => updateDraft("transmission", e.target.value)}><option value="">Selecteer</option><option>Manueel</option><option>Automaat</option></select></Field>
                <Field label="Vermogen"><div className="input-suffix"><input type="number" min="0" value={draft.power} placeholder="150" onChange={e => updateDraft("power", e.target.value)}/><span>pk</span></div></Field>
                <Field label="Aandrijving"><select value={draft.drivetrain} onChange={e => updateDraft("drivetrain", e.target.value)}><option value="">Selecteer</option><option>Voorwielaandrijving</option><option>Achterwielaandrijving</option><option>Vierwielaandrijving</option></select></Field>
                <Field label="Emissienorm"><select value={draft.emission} onChange={e => updateDraft("emission", e.target.value)}><option value="">Selecteer</option>{["Euro 4", "Euro 5", "Euro 6", "Euro 6d", "Euro 7", "N.v.t."].map(x => <option key={x}>{x}</option>)}</select></Field>
                <Field label="Aantal deuren"><select value={draft.doors} onChange={e => updateDraft("doors", e.target.value)}><option value="">Selecteer</option>{["2", "3", "4", "5", "6"].map(x => <option key={x}>{x}</option>)}</select></Field>
                <Field label="Aantal zitplaatsen"><select value={draft.seats} onChange={e => updateDraft("seats", e.target.value)}><option value="">Selecteer</option>{["2", "3", "4", "5", "6", "7", "8", "9"].map(x => <option key={x}>{x}</option>)}</select></Field>
                <Field label="Buitenkleur"><input value={draft.color} placeholder="bv. Saffierzwart" onChange={e => updateDraft("color", e.target.value)}/></Field>
                <Field label="Interieurkleur"><input value={draft.interior} placeholder="bv. Zwart leder" onChange={e => updateDraft("interior", e.target.value)}/></Field>
              </div></section>
              <section className="form-panel panel"><PanelTitle eyebrow="03 / UITRUSTING" title="Opties & uitrusting" description="Selecteer alle opties die aanwezig zijn op dit voertuig."/><div className="equipment-grid">{equipment.map(item => <label key={item} className={"equipment-option " + (draft.equipment.includes(item) ? "option-selected" : "")}><input type="checkbox" checked={draft.equipment.includes(item)} onChange={e => updateDraft("equipment", e.target.checked ? [...draft.equipment, item] : draft.equipment.filter(x => x !== item))}/><span className="option-check"><Icon name="check" size={13}/></span>{item}</label>)}</div></section>
              <section className="form-panel panel"><PanelTitle eyebrow="04 / PRESENTATIE" title="Omschrijving & foto's" description="Laat het voertuig professioneel overkomen met duidelijke informatie en goede foto's."/><div className="form-grid"><div className="field-full"><Field label="Beschrijving"><textarea rows={5} value={draft.description} placeholder="Beschrijf de belangrijkste troeven, onderhoudshistorie en eventuele bijzonderheden…" onChange={e => updateDraft("description", e.target.value)}/></Field></div></div><label className="photo-drop"><Icon name="upload" size={24}/><strong>Voeg foto's toe</strong><span>Kies foto's om de selectie te bekijken. Upload naar de server volgt later.</span><input type="file" accept="image/*" multiple onChange={e => setPhotoNames(Array.from(e.target.files || []).map(f => f.name))}/></label>{photoNames.length > 0 && <p className="photo-names">{photoNames.length} geselecteerd: {photoNames.join(", ")}</p>}</section>
              <section className="form-panel panel"><PanelTitle eyebrow="05 / VERKOOP" title="Prijs & publicatie" description="Bepaal de verkoopinformatie en bewaar je voertuig als concept of gereed."/><div className="form-grid">
                <Field label="Vraagprijs *"><div className="input-prefix"><span>€</span><input type="number" min="0" value={draft.price} placeholder="0" onChange={e => updateDraft("price", e.target.value)}/></div></Field>
                <Field label="Garantie"><select value={draft.warranty} onChange={e => updateDraft("warranty", e.target.value)}><option value="">Selecteer</option><option>Geen</option><option>12 maanden</option><option>24 maanden</option><option>36 maanden</option></select></Field>
                <label className="check-field"><input type="checkbox" checked={draft.vat} onChange={e => updateDraft("vat", e.target.checked)}/><span>BTW aftrekbaar</span></label>
              </div><div className="form-actions"><button className="button-secondary" onClick={() => saveVehicle("draft")}>Bewaar als concept</button><button className="button-primary" onClick={() => saveVehicle("ready")}><Icon name="check" size={17}/> Markeer als klaar</button></div><p className="save-disclaimer">Dit is een lokale designpreview: geen echte publicatie of Supabase-opslag.</p></section>
            </div>
            <aside className="form-aside"><div className="panel side-help"><span className="eyebrow">HANDIG OM TE WETEN</span><h3>Eén pagina. Alles bij de hand.</h3><p>Je hoeft niet door meerdere stappen te klikken. Loop rustig alle onderdelen na en bewaar je gegevens onderaan.</p><div className="help-divider"/><strong>Advertentie importeren</strong><p>Later kun je een advertentielink plakken om gegevens over te nemen, zodra de koppeling is getest.</p><div className="import-input"><Icon name="link" size={16}/><input type="url" value={importUrl} onChange={e => setImportUrl(e.target.value)} placeholder="https://..." aria-label="Advertentielink (nog niet beschikbaar)"/></div><button className="button-disabled" disabled>Import wordt voorbereid</button><small>Een link wordt nu niet opgehaald of verwerkt.</small></div></aside>
          </div>
        </>}

        {pane === "company" && <>
          <section className="page-heading"><div><span className="eyebrow">INSTELLINGEN</span><h1>Bedrijfsprofiel</h1><p>Alle informatie over je garage op één plek.</p></div><button className="button-secondary" onClick={() => notify("Bedrijfsgegevens blijven voorlopig alleen lokaal opgeslagen in deze browser.")}><Icon name="check" size={17}/> Bewaar preview</button></section>
          <div className="company-layout"><section className="form-panel panel"><PanelTitle eyebrow="JOUW ONDERNEMING" title="Algemene gegevens" description="Deze velden sluiten aan op de bestaande dealerstructuur. De echte accountkoppeling volgt later."/><div className="form-grid">
            <Field label="Bedrijfsnaam"><input value={company.name} placeholder="Naam van je garage" onChange={e => setCompany(old => ({ ...old, name: e.target.value }))}/></Field>
            <Field label="BTW-/ondernemingsnummer"><input value={company.vat} placeholder="BE 0123.456.789" onChange={e => setCompany(old => ({ ...old, vat: e.target.value }))}/></Field>
            <Field label="Zakelijk e-mailadres"><input type="email" value={company.email} placeholder="info@garage.be" onChange={e => setCompany(old => ({ ...old, email: e.target.value }))}/></Field>
            <Field label="Telefoonnummer"><input type="tel" value={company.phone} placeholder="+32 ..." onChange={e => setCompany(old => ({ ...old, phone: e.target.value }))}/></Field>
            <Field label="Straat en huisnummer"><input value={company.street} onChange={e => setCompany(old => ({ ...old, street: e.target.value }))}/></Field>
            <Field label="Postcode"><input value={company.zip} onChange={e => setCompany(old => ({ ...old, zip: e.target.value }))}/></Field>
            <Field label="Gemeente"><input value={company.city} onChange={e => setCompany(old => ({ ...old, city: e.target.value }))}/></Field>
            <Field label="Website"><input type="url" value={company.website} placeholder="https://" onChange={e => setCompany(old => ({ ...old, website: e.target.value }))}/></Field>
            <div className="field-full"><Field label="Over ons"><textarea rows={4} value={company.about} onChange={e => setCompany(old => ({ ...old, about: e.target.value }))} placeholder="Vertel kort over je garage en dienstverlening."/></Field></div>
          </div></section><aside className="panel company-tip"><Icon name="shield" size={25}/><h3>Je gegevens blijven privé.</h3><p>In deze preview worden je velden alleen in deze browser bewaard. Er worden nog geen echte dealeraccounts aangemaakt of bijgewerkt.</p></aside></div>
        </>}
      </main>
    </div>
  </div>;
}
