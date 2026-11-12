import Link from "next/link";
import { vehicleStatus } from "./actions";
import { ConfirmDelete } from "./confirm-delete";
import { QuickImport } from "./quick-import";

export type DealerVehicle = {
  id: string; dealer_id: string; make: string; model: string; version: string | null;
  year: number | null; mileage_km: number | null; price_eur: number;
  status: string; created_at: string; source_ref: string | null;
};
export type DealerLead = {
  id: string; dealer_id: string; buyer_name: string; buyer_email: string;
  message: string; status: string; created_at: string;
};
export type DealerTab = "overzicht" | "voertuigen" | "importeren" | "aanvragen";

const money = (amount: number) => new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
const number = (amount: number) => new Intl.NumberFormat("nl-BE").format(amount);

function Badge({ status }: { status: string }) {
  return <span className={"dealer-status dealer-status-" + (["ready", "sold"].includes(status) ? status : "draft")}>
    {status === "ready" ? "Klaar voor lancering" : status === "sold" ? "Verkocht" : "Concept"}
  </span>;
}
function StockRows({ vehicles }: { vehicles: DealerVehicle[] }) {
  if (!vehicles.length) return <div className="dealer-empty-state">
    <div className="dealer-empty-symbol" aria-hidden="true">+</div>
    <h3>Je voorraad is nog leeg</h3>
    <p>Voeg je eerste auto toe om je voertuigen overzichtelijk te beheren.</p>
    <Link className="portal-button dealer-primary-action" href="/portal/voorraad/nieuw">Eerste auto toevoegen</Link>
  </div>;
  return <div className="dealer-stock-table-wrap"><table className="dealer-stock-table">
    <thead><tr><th>Voertuig</th><th>Prijs</th><th>Voortgang</th><th>Beheren</th></tr></thead>
    <tbody>{vehicles.map(vehicle => <tr key={vehicle.id}>
      <td><div className="dealer-vehicle-name"><strong>{vehicle.make} {vehicle.model}</strong>
        <span>{[vehicle.version, vehicle.year, vehicle.mileage_km === null ? "" : number(vehicle.mileage_km) + " km"].filter(Boolean).join(" · ")}</span>
        {vehicle.source_ref && <small>Stocknr. {vehicle.source_ref}</small>}
      </div></td>
      <td className="dealer-price-cell">{money(vehicle.price_eur)}</td>
      <td>
        <Badge status={vehicle.status}/>
        <form action={vehicleStatus} className="dealer-stock-status-form">
          <input type="hidden" name="vehicle_id" value={vehicle.id}/>
          <label><span className="sr-only">Status {vehicle.make} {vehicle.model}</span>
            <select name="status" defaultValue={vehicle.status}>
              <option value="draft">Concept</option><option value="ready">Klaar voor lancering</option><option value="sold">Verkocht</option>
            </select>
          </label>
          <button type="submit">Wijzig</button>
        </form>
      </td>
      <td><div className="dealer-row-actions">
        <Link href={"/portal/voorraad/" + vehicle.id + "/bewerken"}>Bewerken</Link>
        <Link href={"/portal/voorraad/" + vehicle.id + "/bewerken#photos"}>Foto&apos;s</Link>
        <ConfirmDelete vehicleId={vehicle.id}/>
      </div></td>
    </tr>)}</tbody>
  </table></div>;
}
function Pagination({ page, total, tab }: { page: number; total: number; tab: DealerTab }) {
  const last = Math.max(1, Math.ceil(total / 100));
  if (last < 2) return null;
  return <nav className="dealer-pager" aria-label="Pagina's">
    {page > 1 ? <Link href={"/portal?tab=" + tab + "&vehiclePage=" + (page - 1) + "#vehicles"}>← Vorige pagina</Link> : <span/>}
    <span>Pagina {page} van {last}</span>
    {page < last ? <Link href={"/portal?tab=" + tab + "&vehiclePage=" + (page + 1) + "#vehicles"}>Volgende pagina →</Link> : <span/>}
  </nav>;
}

export function DealerWorkspace({
  name, tab, vehicles, leads, vehiclePage, totalVehicles, totalReady, totalSold, totalLeads,
}: {
  name: string; tab: DealerTab; vehicles: DealerVehicle[]; leads: DealerLead[];
  vehiclePage: number; totalVehicles: number; totalReady: number; totalSold: number; totalLeads: number;
}) {
  const sections: { tab: DealerTab; title: string }[] = [
    { tab: "overzicht", title: "Overzicht" },
    { tab: "voertuigen", title: "Mijn voertuigen" },
    { tab: "importeren", title: "Importeren" },
    { tab: "aanvragen", title: "Aanvragen" },
  ];
  const title = { overzicht: "Goed om je terug te zien", voertuigen: "Mijn voertuigen", importeren: "Voertuigen importeren", aanvragen: "Aanvragen" }[tab];
  const subtitle = {
    overzicht: "Dit is je eigen, afgeschermde werkruimte voor de voorbereiding van je voorraad.",
    voertuigen: "Een duidelijk overzicht van alle auto's die je hebt toegevoegd.",
    importeren: "Voeg meerdere auto's toe via een exportbestand van je bestaande stock.",
    aanvragen: "Hier verschijnen berichten van geïnteresseerde kopers zodra deze beschikbaar zijn.",
  }[tab];
  return <div className="dealer-workspace">
    <aside className="dealer-workspace-sidebar" aria-label="Dealernavigatie">
      <div className="dealer-sidebar-caption">WERKRUIMTE</div>
      <nav className="dealer-sidebar-links">
        {sections.map(section => <Link key={section.tab} href={"/portal?tab=" + section.tab}
          aria-current={tab === section.tab ? "page" : undefined} className={tab === section.tab ? "active" : ""}>{section.title}</Link>)}
        <Link href="/portal/voorraad/nieuw" className="dealer-sidebar-add">+ Auto toevoegen</Link>
      </nav>
      <div className="dealer-sidebar-divider"/>
      <Link className="dealer-sidebar-profile" href="/portal/garage">Garageprofiel <span aria-hidden="true">↗</span></Link>
      <p className="dealer-sidebar-note">Je voertuigen blijven privé tot de publieke lancering.</p>
    </aside>
    <main className="dealer-workspace-content" id="dashboard-content">
      <div className="dealer-workspace-header">
        <div><div className="dealer-breadcrumb">IKKENAUTO / {name}</div>
          <h1>{title}</h1><p>{subtitle}</p></div>
        {tab !== "importeren" && <Link className="portal-button dealer-primary-action" href="/portal/voorraad/nieuw">
          <span aria-hidden="true">+</span> Auto toevoegen</Link>}
      </div>

      {tab === "overzicht" && <>
        <div className="dealer-kpi-grid">
          <div className="dealer-kpi"><span>Voertuigen</span><strong>{number(totalVehicles)}</strong><Link href="/portal?tab=voertuigen">Bekijk voorraad →</Link></div>
          <div className="dealer-kpi"><span>Klaar voor lancering</span><strong>{number(totalReady)}</strong><small>In je privévoorraad</small></div>
          <div className="dealer-kpi"><span>Verkocht</span><strong>{number(totalSold)}</strong><small>Afgehandelde voertuigen</small></div>
          <div className="dealer-kpi"><span>Aanvragen</span><strong>{number(totalLeads)}</strong><Link href="/portal?tab=aanvragen">Bekijk aanvragen →</Link></div>
        </div>
        <section className="dealer-content-panel" id="vehicles">
          <div className="dealer-panel-heading"><div><h2>Recente voertuigen</h2><p>Je laatst toegevoegde auto&apos;s.</p></div><Link href="/portal?tab=voertuigen">Alle voertuigen →</Link></div>
          <StockRows vehicles={vehicles.slice(0, 5)}/>
        </section>
        <div className="dealer-info-strip"><div><strong>Je garageprofiel volledig maken?</strong><p>Voeg je logo, omslagfoto en contactgegevens toe zodat je voorbereid bent op de lancering.</p></div><Link href="/portal/garage">Profiel aanvullen →</Link></div>
      </>}

      {tab === "voertuigen" && <section className="dealer-content-panel" id="vehicles">
        <div className="dealer-panel-heading"><div><h2>Voorraad</h2><p>{number(totalVehicles)} auto&apos;s in je eigen voorraad.</p></div>
          <Link href="/portal?tab=importeren" className="dealer-text-link">CSV importeren →</Link></div>
        <StockRows vehicles={vehicles}/><Pagination tab={tab} page={vehiclePage} total={totalVehicles}/>
      </section>}

      {tab === "importeren" && <section className="dealer-content-panel dealer-import-page">
        <div className="dealer-panel-heading"><div><h2>Import uit CSV</h2><p>Controleer het bestand vóór de import. Zo voorkom je dubbele voertuigen.</p></div></div>
        <QuickImport/>
      </section>}

      {tab === "aanvragen" && <section className="dealer-content-panel">
        <div className="dealer-panel-heading"><div><h2>Berichten en aanvragen</h2><p>{number(totalLeads)} aanvragen ontvangen.</p></div></div>
        {leads.length === 0 ? <div className="dealer-empty-state">
          <h3>Nog geen aanvragen</h3><p>Hier komen de berichten van geïnteresseerde kopers te staan.</p>
        </div> : <div className="dealer-inbox">{leads.map(lead => <article key={lead.id} className="dealer-inbox-item">
          <div><strong>{lead.buyer_name}</strong><small>{lead.status}</small></div>
          <p>{lead.message}</p>
          <a href={"mailto:" + lead.buyer_email}>{lead.buyer_email}</a>
        </article>)}</div>}
      </section>}
    </main>
  </div>;
}