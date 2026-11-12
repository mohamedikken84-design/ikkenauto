import Link from "next/link";
import {connection} from "next/server";
import {redirect} from "next/navigation";
import {PortalLogo} from "@/app/portal/portal-logo";
import {createSupabaseServer} from "@/lib/supabase/server";
import {addCatalogEntry} from "./actions";

export const metadata={title:"Voertuigcatalogus beheren | IKKENAUTO"};
type Make={id:number;name:string};
type Model={id:number;name:string;make_id:number};
type Gen={id:number;code:string;model_id:number};
type Engine={id:number;name:string;generation_id:number};
function CatalogAdd({type,title,children}:{type:string;title:string;children:React.ReactNode}){
 return <form action={addCatalogEntry} className="portal-card dealer-catalog-card portal-form">
  <input type="hidden" name="type" value={type}/>
  <h2>{title}</h2>
  {children}
  <label>Naam of code<input type="text" name="name" maxLength={160} required minLength={2} placeholder="Nieuwe waarde toevoegen"/></label>
  <button type="submit" className="portal-button portal-button-secondary">Toevoegen</button>
 </form>;
}
export default async function CatalogManagement({searchParams}:{searchParams:Promise<{success?:string;error?:string}>}){
 await connection();
 const db=await createSupabaseServer();const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/portal?aanmelden=1");
 const {data:admin}=await db.from("portal_admins").select("user_id").eq("user_id",user.id).maybeSingle();
 if(!admin)redirect("/portal");
 const [a,b,c,d,e]=await Promise.all([
  db.from("portal_vehicle_makes").select("id,name").order("name").limit(250),
  db.from("portal_vehicle_models").select("id,name,make_id").order("name").limit(800),
  db.from("portal_vehicle_generations").select("id,code,model_id").order("code").limit(800),
  db.from("portal_vehicle_powertrains").select("id,name,generation_id").order("name").limit(800),
  db.from("portal_vehicle_equipment_catalog").select("code").limit(500),
 ]);
 const makes=(a.data||[]) as Make[],models=(b.data||[]) as Model[],gens=(c.data||[]) as Gen[],engines=(d.data||[]) as Engine[];
 const notice=await searchParams;
 return <div className="portal-shell">
  <header className="portal-top"><PortalLogo/><span className="portal-top-caption">Platformbeheer</span></header>
  <main className="portal-container">
   <Link href="/portal" className="dealer-back-link">← Terug naar platformoverzicht</Link>
   <div className="dealer-workspace-header"><div>
    <span className="dealer-eyebrow">IKKENAUTO · BEHEER</span>
    <h1>Voertuigcatalogus</h1>
    <p>Voeg ontbrekende merken, modellen, generaties, motorisaties en uitvoeringen toe. Nieuwe gegevens blijven ongeverifieerd tot broncontrole.</p>
   </div></div>
   {notice.success&&<p className="portal-alert portal-success" role="status">{notice.success}</p>}
   {notice.error&&<p className="portal-alert portal-error" role="alert">{notice.error}</p>}
   <div className="dealer-kpi-grid">
    <div className="dealer-kpi"><span>Merken</span><strong>{makes.length}</strong></div>
    <div className="dealer-kpi"><span>Modellen</span><strong>{models.length}</strong></div>
    <div className="dealer-kpi"><span>Generaties</span><strong>{gens.length}</strong></div>
    <div className="dealer-kpi"><span>Uitrusting</span><strong>{e.data?.length||0}</strong></div>
   </div>
   <div className="dealer-catalog-grid">
    <CatalogAdd title="Nieuw merk" type="make"><p className="portal-note">Bijvoorbeeld een nieuwe autofabrikant die nog ontbreekt.</p></CatalogAdd>
    <CatalogAdd title="Nieuw model" type="model">
     <label>Merk<select name="make_id" required defaultValue="">
      <option value="" disabled>Kies een merk</option>{makes.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}
     </select></label>
    </CatalogAdd>
    <CatalogAdd title="Generatie / reeks" type="generation">
     <label>Model<select name="model_id" required defaultValue=""><option value="" disabled>Kies het model</option>
      {models.map(x=><option key={x.id} value={x.id}>{makes.find(y=>y.id===x.make_id)?.name||""} {x.name}</option>)}
     </select></label>
     <div className="dealer-form-grid">
      <label>Vanaf bouwjaar<input type="number" name="year_from" min="1900" max="2100"/></label>
      <label>Tot bouwjaar<input type="number" name="year_to" min="1900" max="2100"/></label>
     </div>
    </CatalogAdd>
    <CatalogAdd title="Motorisatie" type="powertrain">
     <label>Generatie<select name="generation_id" required defaultValue=""><option value="" disabled>Kies een generatie</option>
      {gens.map(x=><option key={x.id} value={x.id}>{models.find(y=>y.id===x.model_id)?.name||""} · {x.code}</option>)}
     </select></label>
    </CatalogAdd>
    <CatalogAdd title="Uitvoering" type="trim">
     <label>Motorisatie<select name="powertrain_id" required defaultValue=""><option value="" disabled>Kies een motorisatie</option>
      {engines.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
     </select></label>
    </CatalogAdd>
   </div>
   <p className="dealer-wizard-footnote">Voeg geen technische specificaties of opties toe zonder bron. Dealerinvoer blijft mogelijk, ook als de catalogus nog niet volledig is.</p>
  </main>
 </div>;
}
