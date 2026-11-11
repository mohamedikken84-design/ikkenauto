import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { addProspect, createDealer, createVehicle, deleteVehicle, importVehicles, setDealerStatus, setProspectStage, signIn, signOut, signUp, uploadVehiclePhoto, vehicleStatus } from "./actions";
import type { Metadata } from "next";

export const metadata:Metadata={title:"Dealerportaal | IKKENAUTO",description:"Veilig beheer voor garages en IKKENAUTO."};
const euro=(v:unknown)=>new Intl.NumberFormat("nl-BE",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(Number(v)||0);
type Params={ searchParams: Promise<{error?:string;success?:string;dealerPage?:string;vehiclePage?:string;prospectPage?:string;leadPage?:string}> };
type Vehicle={id:string;dealer_id:string;make:string;model:string;version:string|null;year:number|null;mileage_km:number|null;price_eur:number;status:string;created_at:string;source_ref:string|null};
type Dealer={id:string;name:string;city:string;email:string;status:string;created_at:string;phone:string|null;owner_id:string};
const stageNames:{[k:string]:string}={nieuw:"Nieuw",gecontacteerd:"Gecontacteerd",interesse:"Interesse",aangesloten:"Aangesloten",geen_interesse:"Geen interesse"};
export default async function Portal({searchParams}:Params){
 const notices=await searchParams;
 const safePage=(v?:string)=>Math.max(1,Math.min(100000,Number.isInteger(Number(v))?Number(v)||1:1));
 const dealerPage=safePage(notices.dealerPage),vehiclePage=safePage(notices.vehiclePage),prospectPage=safePage(notices.prospectPage),leadPage=safePage(notices.leadPage);
 const db=await createSupabaseServer();
 const {data:{user}}=await db.auth.getUser();
 let isAdmin=false;
 let dealer:Dealer|null=null;
 if(user){
  const [{data:role},{data:owned}]=await Promise.all([
   db.from("portal_admins").select("user_id").eq("user_id",user.id).maybeSingle(),
   db.from("portal_dealers").select("id,name,city,email,status,created_at,phone,owner_id").eq("owner_id",user.id).maybeSingle(),
  ]);
  isAdmin=Boolean(role);dealer=owned as Dealer|null;
 }
 let dealers:Dealer[]=[];let vehicles:Vehicle[]=[];
 let prospects:{id:string;name:string;city:string|null;email:string|null;phone:string|null;stage:string;created_at:string}[]=[];
 let leads:{id:string;dealer_id:string;buyer_name:string;buyer_email:string;message:string;status:string;created_at:string}[]=[];
 let databaseError="";
 let totalDealers=0,totalVehicles=0,totalReady=0,totalProspects=0,totalLeads=0;
 let dealerCounts:{dealer_id:string;total:number}[]=[];
 let relatedNames:{id:string;name:string}[]=[];
 if(user && isAdmin){
  const [a,b,c,d]=await Promise.all([
   db.from("portal_dealers").select("id,name,city,email,status,created_at,phone,owner_id").order("created_at",{ascending:false}).range((dealerPage-1)*100,dealerPage*100-1),
   db.from("portal_vehicles").select("id,dealer_id,make,model,version,year,mileage_km,price_eur,status,created_at,source_ref").order("created_at",{ascending:false}).range((vehiclePage-1)*100,vehiclePage*100-1),
   db.from("portal_prospects").select("id,name,city,email,phone,stage,created_at").order("created_at",{ascending:false}).range((prospectPage-1)*100,prospectPage*100-1),
   db.from("portal_leads").select("id,dealer_id,buyer_name,buyer_email,message,status,created_at").order("created_at",{ascending:false}).range((leadPage-1)*100,leadPage*100-1),
  ]);
  dealers=(a.data||[]) as Dealer[];vehicles=(b.data||[]) as Vehicle[];prospects=c.data||[];leads=d.data||[];
  databaseError=[a.error,b.error,c.error,d.error].filter(Boolean).map(e=>e?.message).join(" ");
  const [dc,vc,rc,pc,lc]=await Promise.all([
   db.from("portal_dealers").select("id",{head:true,count:"exact"}),
   db.from("portal_vehicles").select("id",{head:true,count:"exact"}),
   db.from("portal_vehicles").select("id",{head:true,count:"exact"}).eq("status","ready"),
   db.from("portal_prospects").select("id",{head:true,count:"exact"}),
   db.from("portal_leads").select("id",{head:true,count:"exact"}),
  ]);
  totalDealers=dc.count??0;totalVehicles=vc.count??0;totalReady=rc.count??0;totalProspects=pc.count??0;totalLeads=lc.count??0;
  if(dealers.length){const res=await db.from("portal_dealer_stock_counts").select("dealer_id,total").in("dealer_id",dealers.map(d=>d.id));dealerCounts=res.data||[];}
  if(vehicles.length){const res=await db.from("portal_dealers").select("id,name").in("id",[...new Set(vehicles.map(v=>v.dealer_id))]);relatedNames=res.data||[];}
 } else if(user&&dealer){
  const [a,b]=await Promise.all([
   db.from("portal_vehicles").select("id,dealer_id,make,model,version,year,mileage_km,price_eur,status,created_at,source_ref").eq("dealer_id",dealer.id).order("created_at",{ascending:false}).limit(1000),
   db.from("portal_leads").select("id,dealer_id,buyer_name,buyer_email,message,status,created_at").eq("dealer_id",dealer.id).order("created_at",{ascending:false}).limit(100),
  ]);
  vehicles=(a.data||[]) as Vehicle[];leads=b.data||[];
  databaseError=[a.error,b.error].filter(Boolean).map(e=>e?.message).join(" ");
 }
 const dealerName=new Map([...dealers.map(d=>[d.id,d.name] as const),...relatedNames.map(d=>[d.id,d.name] as const)]);
 const stockCount=new Map(dealerCounts.map(d=>[d.dealer_id,d.total]));
 return <div className="portal-shell">
  <div className="portal-top"><Link className="portal-brand" href="/portal"><span>IK</span><span className="portal-brand-gold">K</span><span>ENAUTO</span><small>.BE</small></Link><span className="portal-top-caption">Dealer intelligence & voorraadbeheer</span>{user?<form action={signOut}><button className="portal-ghost">Uitloggen</button></form>:<span className="portal-secure">Beveiligd portaal</span>}</div>
  <div className="portal-container">
  {notices.error&&<div role="alert" className="portal-alert portal-error">{notices.error}</div>}
  {notices.success&&<div role="status" className="portal-alert portal-success">{notices.success}</div>}
  {databaseError&&<div className="portal-alert portal-error">Databasefout: {databaseError}</div>}
  {!user?<section className="portal-auth-layout">
   <div className="portal-auth-intro"><span className="portal-overline">IKKENAUTO / PROFESSIONAL</span><h1>Jouw voorraad.<br/><em>Onze volgende stap.</em></h1><p>Maak vandaag al een dealeraccount aan, voeg auto's toe en bouw je aanbod op voor de lancering van IKKENAUTO.</p><div className="portal-benefits"><span>✓ Privé voorraadbeheer</span><span>✓ CSV-import en foto's</span><span>✓ Beveiligde dealeraccounts</span></div></div>
   <div className="portal-auth-card"><span className="portal-overline">WELKOM TERUG</span><h2>Aanmelden</h2><p>Voor dealers en de IKKENAUTO-beheerder.</p><form action={signIn} className="portal-form"><label>E-mailadres<input type="email" name="email" autoComplete="email" placeholder="naam@garage.be" required/></label><label>Wachtwoord<input type="password" name="password" autoComplete="current-password" required/></label><button className="portal-button">Inloggen <span aria-hidden>→</span></button></form><details className="portal-disclosure"><summary>Nieuw bij IKKENAUTO? Maak een account</summary><form action={signUp} className="portal-form"><label>Zakelijk e-mailadres<input type="email" name="email" required autoComplete="email"/></label><label>Wachtwoord (minstens 10 tekens)<input type="password" name="password" minLength={10} required autoComplete="new-password"/></label><button className="portal-button portal-button-secondary">Account registreren</button><p className="portal-note">Na e-mailbevestiging kun je je garage toevoegen. Een registratie geeft nooit automatisch adminrechten.</p></form></details><p className="portal-note">Wachtwoord vergeten? <Link href="/portal/wachtwoord">Herstel via e-mail</Link></p></div>
  </section>:
   <>
    <div className="portal-heading"><div><span className="portal-overline">{isAdmin?"PLATFORMBEHEER":dealer?"DEALER WORKSPACE":"EERSTE KEER"}</span><h1>{isAdmin?"IKKENAUTO Control Center":dealer?dealer.name:"Welkom bij IKKENAUTO"}</h1><p>{isAdmin?"Alle aangesloten handelaars, alle auto's en alle prospecten in één omgeving.":dealer?"Beheer je voorraad voor de lancering. Alleen jouw garage ziet deze gegevens.":"Vul je bedrijfsgegevens in om je dealeromgeving te activeren."}</p></div><div className="portal-identity">{user.email}<br/><strong>{isAdmin?"Platformbeheer":dealer?"Dealeraccount":"Nieuw account"}</strong></div></div>
    {isAdmin?<><div className="portal-stats"><Stat label="Aangesloten dealers" number={totalDealers}/><Stat label="Auto's in databank" number={totalVehicles}/><Stat label="Verkoopklaar" number={totalReady}/><Stat label="Prospecten" number={totalProspects}/></div>
      <div className="portal-grid"><section id="dealers" className="portal-card portal-wide"><div className="portal-card-heading"><div><span className="portal-overline">DEALERNETWERK</span><h2>Alle autohandelaars</h2></div><span className="portal-count">{totalDealers} accounts</span></div><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Garage</th><th>Plaats</th><th>Contact</th><th>Voertuigen</th><th>Goedkeuring</th></tr></thead><tbody>{dealers.map(d=><tr key={d.id}><td><strong>{d.name}</strong><small>{d.id.slice(0,8)}</small></td><td>{d.city}</td><td><a href={"mailto:"+d.email}>{d.email}</a>{d.phone&&<small>{d.phone}</small>}</td><td>{stockCount.get(d.id)??0}</td><td><form action={setDealerStatus} className="portal-inline"><input type="hidden" name="id" value={d.id}/><select name="status" defaultValue={d.status}><option value="pending">In beoordeling</option><option value="verified">Geverifieerd</option><option value="suspended">Geblokkeerd</option></select><button>Opslaan</button></form></td></tr>)}</tbody></table>{dealers.length===0&&<Empty>Er zijn nog geen geregistreerde garages op deze pagina.</Empty>}</div><Pagination page={dealerPage} total={totalDealers} field="dealerPage" anchor="dealers"/></section>
      <section id="vehicles" className="portal-card portal-wide"><div className="portal-card-heading"><div><span className="portal-overline">TOTALE STOCK</span><h2>Auto's van alle dealers</h2></div><span className="portal-count">{totalVehicles} voertuigen</span></div><VehicleTable vehicles={vehicles} dealerName={dealerName}/><Pagination page={vehiclePage} total={totalVehicles} field="vehiclePage" anchor="vehicles"/></section>
      <section id="prospects" className="portal-card portal-wide"><div className="portal-card-heading"><div><span className="portal-overline">ACQUISITIE</span><h2>Te contacteren handelaars</h2></div><span className="portal-count">{totalProspects} prospecten</span></div><form action={addProspect} className="portal-form portal-fields"><label>Garagenaam<input name="name" required placeholder="Naam autohandelaar"/></label><label>Gemeente<input name="city" placeholder="Mechelen"/></label><label>E-mail<input name="email" type="email" placeholder="info@garage.be"/></label><label>Telefoon<input name="phone"/></label><button className="portal-button">Prospect toevoegen</button></form><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Handelaar</th><th>Contact</th><th>Opvolging</th></tr></thead><tbody>{prospects.map(p=><tr key={p.id}><td><strong>{p.name}</strong><small>{p.city||"—"}</small></td><td>{p.email||"—"}<small>{p.phone||""}</small></td><td><form action={setProspectStage} className="portal-inline"><input type="hidden" name="id" value={p.id}/><select name="stage" defaultValue={p.stage}>{Object.entries(stageNames).map(([k,n])=><option key={k} value={k}>{n}</option>)}</select><button>Opslaan</button></form></td></tr>)}</tbody></table></div><Pagination page={prospectPage} total={totalProspects} field="prospectPage" anchor="prospects"/></section>
      <section id="leads" className="portal-card portal-wide"><div className="portal-card-heading"><div><span className="portal-overline">INBOX</span><h2>Alle aanvragen</h2></div><span className="portal-count">{totalLeads}</span></div><LeadList leads={leads} dealerName={dealerName}/><Pagination page={leadPage} total={totalLeads} field="leadPage" anchor="leads"/></section></div>
     </>:dealer?<><div className="portal-stats"><Stat label="Mijn voertuigen" number={vehicles.length}/><Stat label="Klaar voor lancering" number={vehicles.filter(v=>v.status==="ready").length}/><Stat label="Verkocht" number={vehicles.filter(v=>v.status==="sold").length}/><Stat label="Aanvragen" number={leads.length}/></div><div className="portal-grid">
       <section className="portal-card"><span className="portal-overline">VOORRAADBEHEER</span><h2>Voertuig toevoegen</h2><form action={createVehicle} className="portal-form portal-fields"><label>Merk *<input name="make" required placeholder="BMW"/></label><label>Model *<input name="model" required placeholder="320d"/></label><label>Uitvoering<input name="version" placeholder="M Sport"/></label><label>Prijs (€) *<input name="price_eur" type="number" min="0" step=".01" required/></label><label>Bouwjaar<input name="year" type="number" min="1900" max="2100"/></label><label>Kilometers<input name="mileage_km" type="number" min="0"/></label><label>Brandstof<select name="fuel" defaultValue=""><option value="">Kies</option><option>Diesel</option><option>Benzine</option><option>Elektrisch</option><option>Hybride</option><option>Plug-in hybride</option></select></label><label>Transmissie<select name="transmission" defaultValue=""><option value="">Kies</option><option>Automaat</option><option>Manueel</option></select></label><label>Stockreferentie<input name="source_ref" placeholder="GAR-123"/></label><label className="portal-full">Omschrijving<textarea name="description" rows={3}/></label><button className="portal-button portal-full">Voertuig opslaan</button></form></section>
       <section className="portal-card"><span className="portal-overline">BULK IMPORT</span><h2>CSV-voorraad importeren</h2><p>Upload een CSV-bestand tot 300 auto's. Bestaande stocknummers worden bijgewerkt; overige auto's worden toegevoegd. Een import verwijdert nooit ontbrekende auto's.</p><form action={importVehicles} className="portal-form"><label>CSV-bestand<input type="file" name="csv" accept=".csv,text/csv" required/></label><button className="portal-button portal-button-secondary">Voorraad importeren</button></form><p className="portal-note">Kolommen: merk, model, prijs, stocknummer, bouwjaar, kilometerstand, brandstof, transmissie. Komma of puntkomma als scheidingsteken.</p><div className="portal-rule"/><span className="portal-overline">ACCOUNTSTATUS</span><h3>{dealer.status==="verified"?"Garage geverifieerd":dealer.status==="suspended"?"Account geblokkeerd":"Garage in beoordeling"}</h3><p>Alleen het IKKENAUTO-team kan een garage goedkeuren. De voorraad wordt nog niet openbaar gepubliceerd.</p></section>
       <section className="portal-card portal-wide"><div className="portal-card-heading"><div><span className="portal-overline">MIJN STOCK</span><h2>Voertuigen</h2></div><span className="portal-count">{vehicles.length} auto's</span></div>{vehicles.length===0?<Empty>Voeg je eerste voertuig toe of importeer je bestaande voorraad.</Empty>:<div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Auto</th><th>Prijs</th><th>Voortgang</th><th>Foto</th><th>Actie</th></tr></thead><tbody>{vehicles.map(v=><tr key={v.id}><td><strong>{v.make} {v.model}</strong><small>{v.version||""} {v.year||""} · {v.mileage_km??"—"} km</small></td><td>{euro(v.price_eur)}</td><td><form action={vehicleStatus} className="portal-inline"><input type="hidden" name="vehicle_id" value={v.id}/><select name="status" defaultValue={v.status}><option value="draft">Concept</option><option value="ready">Klaar</option><option value="sold">Verkocht</option></select><button>Opslaan</button></form></td><td><form action={uploadVehiclePhoto} className="portal-inline"><input type="hidden" name="vehicle_id" value={v.id}/><input name="photo" type="file" accept="image/png,image/jpeg,image/webp" required/><button>Upload</button></form></td><td><form action={deleteVehicle}><input name="vehicle_id" type="hidden" value={v.id}/><button className="portal-delete">Verwijder</button></form></td></tr>)}</tbody></table></div>}</section>
       <section className="portal-card portal-wide"><span className="portal-overline">AANVRAGEN</span><h2>Leads voor je garage</h2><LeadList leads={leads}/></section>
      </div></>:<section className="portal-card portal-setup"><span className="portal-overline">STAP 1 VAN 2</span><h2>Maak jouw garageprofiel</h2><p>Dit is privé totdat je garage geverifieerd wordt. Je kunt hierna onmiddellijk auto's toevoegen.</p><form action={createDealer} className="portal-form portal-fields"><label>Bedrijfsnaam *<input name="name" required/></label><label>Gemeente *<input name="city" required/></label><label>Ondernemingsnummer<input name="kbo_number" inputMode="numeric"/></label><label>Postcode<input name="postal_code"/></label><label>Telefoon<input name="phone" type="tel"/></label><label>Website<input name="website" type="url" placeholder="https://"/></label><button className="portal-button portal-full">Dealerprofiel aanmaken</button></form></section>}
   </>}
  <div className="portal-footer">IKKENAUTO · Professionele voorraadverzameling · Privé tot officiële lancering</div>
  </div>
 </div>;
}
function Stat({label,number}:{label:string;number:number}){return <div className="portal-stat"><span>{label}</span><strong>{new Intl.NumberFormat("nl-BE").format(number)}</strong></div>;}
function Empty({children}:{children:React.ReactNode}){return <p className="portal-empty">{children}</p>;}
function VehicleTable({vehicles,dealerName}:{vehicles:Vehicle[];dealerName:Map<string,string>}){return vehicles.length===0?<Empty>Er is nog geen voorraad ingevoerd.</Empty>:<div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Handelaar</th><th>Voertuig</th><th>Bouwjaar / km</th><th>Prijs</th><th>Status</th></tr></thead><tbody>{vehicles.map(v=><tr key={v.id}><td><strong>{dealerName.get(v.dealer_id)||"Onbekend"}</strong></td><td>{v.make} {v.model}<small>{v.version||v.source_ref||""}</small></td><td>{v.year||"—"} · {v.mileage_km??"—"} km</td><td>{euro(v.price_eur)}</td><td><span className="portal-pill">{v.status==="ready"?"Klaar":v.status==="sold"?"Verkocht":"Concept"}</span></td></tr>)}</tbody></table></div>;}
function LeadList({leads,dealerName}:{leads:{id:string;dealer_id:string;buyer_name:string;buyer_email:string;message:string;status:string;created_at:string}[];dealerName?:Map<string,string>}){return leads.length===0?<Empty>Nog geen aanvragen ontvangen.</Empty>:<div className="portal-leads">{leads.map(l=><div className="portal-lead" key={l.id}><strong>{l.buyer_name}</strong> · <a href={"mailto:"+l.buyer_email}>{l.buyer_email}</a>{dealerName&&<small>{dealerName.get(l.dealer_id)}</small>}<p>{l.message}</p><span className="portal-pill">{l.status}</span></div>)}</div>;}

function Pagination({page,total,field,anchor}:{page:number;total:number;field:string;anchor:string}){
 const last=Math.max(1,Math.ceil(total/100));
 if(last<2)return null;
 return <nav aria-label="Pagina's" className="portal-pagination">
  {page>1?<Link href={`/portal?${field}=${page-1}#${anchor}`}>← Vorige</Link>:<span/>}
  <span>Pagina {page} van {last}</span>
  {page<last?<Link href={`/portal?${field}=${page+1}#${anchor}`}>Volgende →</Link>:<span/>}
 </nav>;
}
