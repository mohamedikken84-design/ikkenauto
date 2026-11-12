import {PortalLogo} from "@/app/portal/portal-logo";
import Link from "next/link";
import { connection } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { addProspect, setDealerStatus, setProspectStage, signOut } from "./actions";
import type { Metadata } from "next";
import { AuthPanel } from "./auth-panel";
import { DealerSetup } from "./dealer-setup";
import { DealerWorkspace, type DealerTab } from "./dealer-workspace";
import { DirectoryAdmin } from "./directory-admin";

export const metadata:Metadata={title:"Dealerportaal | IKKENAUTO",description:"Veilig beheer voor garages en IKKENAUTO."};
const euro=(v:unknown)=>new Intl.NumberFormat("nl-BE",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(Number(v)||0);
type Params={ searchParams: Promise<{error?:string;success?:string;registreren?:string;aanmelden?:string;dealerPage?:string;vehiclePage?:string;prospectPage?:string;leadPage?:string;tab?:string}> };
type Vehicle={id:string;dealer_id:string;make:string;model:string;version:string|null;year:number|null;mileage_km:number|null;price_eur:number;status:string;created_at:string;source_ref:string|null};
type Dealer={id:string;name:string;city:string;email:string;status:string;created_at:string;phone:string|null;owner_id:string};
const stageNames:{[k:string]:string}={nieuw:"Nieuw",gecontacteerd:"Gecontacteerd",interesse:"Interesse",aangesloten:"Aangesloten",geen_interesse:"Geen interesse"};
export default async function Portal({searchParams}:Params){
 await connection();
 const notices=await searchParams;
 const safePage=(v?:string)=>Math.max(1,Math.min(100000,Number.isInteger(Number(v))?Number(v)||1:1));
 const dealerPage=safePage(notices.dealerPage),vehiclePage=safePage(notices.vehiclePage),prospectPage=safePage(notices.prospectPage),leadPage=safePage(notices.leadPage);
 const dealerTab:DealerTab=notices.tab==="voertuigen"||notices.tab==="importeren"||notices.tab==="aanvragen"?notices.tab:"overzicht";
 const db=await createSupabaseServer();
 const {data:{user}}=await db.auth.getUser();
 let isAdmin=false;
 let suggestedCompany:{source_row:number;name:string;city:string|null;website:string|null}|null=null;
 let dealer:Dealer|null=null;
 if(user){
  const [{data:role},{data:owned}]=await Promise.all([
   db.from("portal_admins").select("user_id").eq("user_id",user.id).maybeSingle(),
   db.from("portal_dealers").select("id,name,city,email,status,created_at,phone,owner_id").eq("owner_id",user.id).maybeSingle(),
  ]);
  isAdmin=Boolean(role);dealer=owned as Dealer|null;
  if(!dealer&&!isAdmin){
    const rowNumber=Number(user.user_metadata?.suggested_directory_row);
    if(Number.isInteger(rowNumber)&&rowNumber>0){const {data}=await db.from("portal_directory").select("source_row,name,city,website").eq("source_row",rowNumber).maybeSingle();suggestedCompany=data;}
  }
 }
 let dealers:Dealer[]=[];let vehicles:Vehicle[]=[];
 let prospects:{id:string;name:string;city:string|null;email:string|null;phone:string|null;stage:string;created_at:string}[]=[];
 let leads:{id:string;dealer_id:string;buyer_name:string;buyer_email:string;message:string;status:string;created_at:string}[]=[];
 let databaseError="";
 let totalDealers=0,totalVehicles=0,totalReady=0,totalSold=0,totalProspects=0,totalLeads=0,directoryTotal=0;
 let directoryClaims:{id:number;source_row:number;user_id:string;status:string;evidence:string|null;created_at:string}[]=[];
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
  const [directoryCount,claimsResult]=await Promise.all([db.from("portal_directory").select("id",{count:"exact",head:true}),db.from("portal_directory_claims").select("id,source_row,user_id,status,evidence,created_at").order("created_at",{ascending:false}).limit(100)]);
  directoryTotal=directoryCount.count??0;directoryClaims=claimsResult.data||[];
  if(dealers.length){const res=await db.from("portal_dealer_stock_counts").select("dealer_id,total").in("dealer_id",dealers.map(d=>d.id));dealerCounts=res.data||[];}
  if(vehicles.length){const res=await db.from("portal_dealers").select("id,name").in("id",[...new Set(vehicles.map(v=>v.dealer_id))]);relatedNames=res.data||[];}
 } else if(user&&dealer){
  // Load only the data needed by the active dealer screen.
  // Import screen has no inventory/inbox database request. On large dealer accounts
  // this removes up to six unnecessary Supabase round trips per navigation.
  const ownerId=dealer.id;
  if(dealerTab==="overzicht"){
   const [stock,vc,rc,sc,lc]=await Promise.all([
    db.from("portal_vehicles").select("id,dealer_id,make,model,version,year,mileage_km,price_eur,status,created_at,source_ref")
      .eq("dealer_id",ownerId).order("created_at",{ascending:false}).limit(5),
    db.from("portal_vehicles").select("id",{head:true,count:"exact"}).eq("dealer_id",ownerId),
    db.from("portal_vehicles").select("id",{head:true,count:"exact"}).eq("dealer_id",ownerId).eq("status","ready"),
    db.from("portal_vehicles").select("id",{head:true,count:"exact"}).eq("dealer_id",ownerId).eq("status","sold"),
    db.from("portal_leads").select("id",{head:true,count:"exact"}).eq("dealer_id",ownerId),
   ]);
   vehicles=(stock.data||[]) as Vehicle[];
   totalVehicles=vc.count??0;totalReady=rc.count??0;totalSold=sc.count??0;totalLeads=lc.count??0;
   databaseError=[stock.error,vc.error,rc.error,sc.error,lc.error].filter(Boolean).map(e=>e?.message).join(" ");
  }else if(dealerTab==="voertuigen"){
   const [stock,vc]=await Promise.all([
    db.from("portal_vehicles").select("id,dealer_id,make,model,version,year,mileage_km,price_eur,status,created_at,source_ref")
      .eq("dealer_id",ownerId).order("created_at",{ascending:false}).range((vehiclePage-1)*100,vehiclePage*100-1),
    db.from("portal_vehicles").select("id",{head:true,count:"exact"}).eq("dealer_id",ownerId),
   ]);
   vehicles=(stock.data||[]) as Vehicle[];totalVehicles=vc.count??0;
   databaseError=[stock.error,vc.error].filter(Boolean).map(e=>e?.message).join(" ");
  }else if(dealerTab==="aanvragen"){
   const [inbox,lc]=await Promise.all([
    db.from("portal_leads").select("id,dealer_id,buyer_name,buyer_email,message,status,created_at")
      .eq("dealer_id",ownerId).order("created_at",{ascending:false}).range((leadPage-1)*100,leadPage*100-1),
    db.from("portal_leads").select("id",{head:true,count:"exact"}).eq("dealer_id",ownerId),
   ]);
   leads=(inbox.data||[]) as typeof leads;totalLeads=lc.count??0;
   databaseError=[inbox.error,lc.error].filter(Boolean).map(e=>e?.message).join(" ");
  }
 }

 const dealerName=new Map([...dealers.map(d=>[d.id,d.name] as const),...relatedNames.map(d=>[d.id,d.name] as const)]);
 const stockCount=new Map(dealerCounts.map(d=>[d.dealer_id,d.total]));
 return <div className="portal-shell">
  <div className="portal-top"><PortalLogo/><span className="portal-top-caption">Dealerportaal</span>{user?<form action={signOut}><button className="portal-ghost">Uitloggen</button></form>:<nav className="dealer-top-links" aria-label="Account"><Link href="/portal?aanmelden=1#account">Inloggen</Link><Link className="dealer-nav-register" href="/portal?registreren=1#account">Garage registreren</Link></nav>}</div>
  <div className="portal-container">
  {notices.error&&<div role="alert" className="portal-alert portal-error">{notices.error}</div>}
  {notices.success&&<div role="status" className="portal-alert portal-success">{notices.success}</div>}
  {databaseError&&<div className="portal-alert portal-error">Databasefout: {databaseError}</div>}
  {!user?<AuthPanel key={notices.registreren==="1"?"register":notices.aanmelden==="1"?"login":"welcome"} initialView={notices.registreren==="1"?"register":notices.aanmelden==="1"?"login":"welcome"}/>:
   <>
    {isAdmin && <div className="portal-heading"><div><span className="portal-overline">{isAdmin?"PLATFORMBEHEER":dealer?"DEALER WORKSPACE":"EERSTE KEER"}</span><h1>{isAdmin?"IKKENAUTO Control Center":dealer?dealer.name:"Welkom bij IKKENAUTO"}</h1><p>{isAdmin?"Alle aangesloten handelaars, alle auto's en alle prospecten in één omgeving.":dealer?"Beheer je voorraad voor de lancering. Alleen jouw garage ziet deze gegevens.":"Vul je bedrijfsgegevens in om je dealeromgeving te activeren."}</p>{dealer&&!isAdmin&&<Link className="dealer-profile-link" href="/portal/garage">Garageprofiel beheren</Link>}</div><div className="portal-identity">{user.email}<br/><strong>{isAdmin?"Platformbeheer":dealer?"Dealeraccount":"Nieuw account"}</strong></div></div>}
    {isAdmin?<><div className="portal-stats"><Stat label="Aangesloten dealers" number={totalDealers}/><Stat label="Auto's in databank" number={totalVehicles}/><Stat label="Verkoopklaar" number={totalReady}/><Stat label="Prospecten" number={totalProspects}/><Stat label="Bedrijvengids" number={directoryTotal}/></div>
      <div className="portal-grid"><section id="dealers" className="portal-card portal-wide"><div className="portal-card-heading"><div><span className="portal-overline">DEALERNETWERK</span><h2>Alle autohandelaars</h2></div><span className="portal-count">{totalDealers} accounts</span></div><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Garage</th><th>Plaats</th><th>Contact</th><th>Voertuigen</th><th>Goedkeuring</th></tr></thead><tbody>{dealers.map(d=><tr key={d.id}><td><strong>{d.name}</strong><small>{d.id.slice(0,8)}</small></td><td>{d.city}</td><td><a href={"mailto:"+d.email}>{d.email}</a>{d.phone&&<small>{d.phone}</small>}</td><td>{stockCount.get(d.id)??0}</td><td><form action={setDealerStatus} className="portal-inline"><input type="hidden" name="id" value={d.id}/><select name="status" defaultValue={d.status}><option value="pending">In beoordeling</option><option value="verified">Geverifieerd</option><option value="suspended">Geblokkeerd</option></select><button>Opslaan</button></form></td></tr>)}</tbody></table>{dealers.length===0&&<Empty>Er zijn nog geen geregistreerde garages op deze pagina.</Empty>}</div><Pagination page={dealerPage} total={totalDealers} field="dealerPage" anchor="dealers"/></section>
      <section id="vehicles" className="portal-card portal-wide"><div className="portal-card-heading"><div><span className="portal-overline">TOTALE STOCK</span><h2>Auto&apos;s van alle dealers</h2></div><span className="portal-count">{totalVehicles} voertuigen</span></div><VehicleTable vehicles={vehicles} dealerName={dealerName}/><Pagination page={vehiclePage} total={totalVehicles} field="vehiclePage" anchor="vehicles"/></section>
      <section id="prospects" className="portal-card portal-wide"><div className="portal-card-heading"><div><span className="portal-overline">ACQUISITIE</span><h2>Te contacteren handelaars</h2></div><span className="portal-count">{totalProspects} prospecten</span></div><form action={addProspect} className="portal-form portal-fields"><label>Garagenaam<input name="name" required placeholder="Naam autohandelaar"/></label><label>Gemeente<input name="city" placeholder="Mechelen"/></label><label>E-mail<input name="email" type="email" placeholder="info@garage.be"/></label><label>Telefoon<input name="phone"/></label><button className="portal-button">Prospect toevoegen</button></form><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Handelaar</th><th>Contact</th><th>Opvolging</th></tr></thead><tbody>{prospects.map(p=><tr key={p.id}><td><strong>{p.name}</strong><small>{p.city||"—"}</small></td><td>{p.email||"—"}<small>{p.phone||""}</small></td><td><form action={setProspectStage} className="portal-inline"><input type="hidden" name="id" value={p.id}/><select name="stage" defaultValue={p.stage}>{Object.entries(stageNames).map(([k,n])=><option key={k} value={k}>{n}</option>)}</select><button>Opslaan</button></form></td></tr>)}</tbody></table></div><Pagination page={prospectPage} total={totalProspects} field="prospectPage" anchor="prospects"/></section>
      <section id="leads" className="portal-card portal-wide"><div className="portal-card-heading"><div><span className="portal-overline">INBOX</span><h2>Alle aanvragen</h2></div><span className="portal-count">{totalLeads}</span></div><LeadList leads={leads} dealerName={dealerName}/><Pagination page={leadPage} total={totalLeads} field="leadPage" anchor="leads"/></section><DirectoryAdmin count={directoryTotal} claims={directoryClaims}/></div>
     </>:dealer?<DealerWorkspace name={dealer.name} tab={dealerTab} vehicles={vehicles} leads={leads} vehiclePage={vehiclePage} leadPage={leadPage} totalVehicles={totalVehicles} totalReady={totalReady} totalSold={totalSold} totalLeads={totalLeads}/>:<DealerSetup suggestedCompany={suggestedCompany}/>}
   </>}
  <footer className="portal-footer dealer-footer"><span>© {new Date().getFullYear()} IKKENAUTO · Publieke marktplaats in voorbereiding</span><nav aria-label="Informatie"><a href="mailto:info@ikkenauto.be">Contact</a><Link href="/privacy">Privacy</Link><Link href="/voorwaarden">Voorwaarden</Link><a href="mailto:info@ikkenauto.be?subject=Bedrijfsgegevens">Bedrijfsgegevens</a></nav></footer>
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
