import Link from "next/link";
import {redirect} from "next/navigation";
import {createSupabaseServer} from "@/lib/supabase/server";
import {GarageProfileForm} from "./garage-form";
import {uploadGarageMedia} from "./actions";
export const metadata={title:"Garageprofiel | IKKENAUTO"};
export default async function GarageProfile({searchParams}:{searchParams:Promise<{success?:string;error?:string}>}){
 const notice=await searchParams,db=await createSupabaseServer(),{data:{user}}=await db.auth.getUser();
 if(!user)redirect("/portal?aanmelden=1");
 const {data:g}=await db.from("portal_dealers").select("id,owner_id,name,city,postal_code,street,phone,website,description,kbo_number,status,logo_path,cover_path").eq("owner_id",user.id).maybeSingle();
 if(!g)redirect("/portal");
 const store=db.storage.from("portal-garage-media");
 const logoUrl=g.logo_path?(await store.createSignedUrl(g.logo_path,3600)).data?.signedUrl:null;
 const coverUrl=g.cover_path?(await store.createSignedUrl(g.cover_path,3600)).data?.signedUrl:null;
 return <div className="portal-shell">
  <div className="portal-top"><Link href="/portal" className="portal-brand"><span>IK</span><span className="portal-brand-gold">K</span><span>ENAUTO</span><small>.BE</small></Link><span className="portal-top-caption">Garageprofiel</span></div>
  <div className="portal-container">
   <Link className="dealer-back-link" href="/portal">← Terug naar dashboard</Link>
   <div className="portal-heading"><div><span className="portal-overline">BEDRIJFSGEGEVENS</span><h1>{g.name}</h1><p>Vul je profiel aan voor de publieke lancering. Je foto's blijven voorlopig privé.</p></div><span className="portal-pill">{g.status==="verified"?"Geverifieerd":g.status==="suspended"?"Geblokkeerd":"In beoordeling"}</span></div>
   {notice.success&&<p className="portal-alert portal-success" role="status">{notice.success}</p>}
   {notice.error&&<p className="portal-alert portal-error" role="alert">{notice.error}</p>}
   <div className="portal-grid">
    <article className="portal-card"><span className="portal-overline">GARAGE</span><h2>Bedrijfsprofiel</h2><GarageProfileForm garage={g}/></article>
    <aside className="portal-card"><span className="portal-overline">BEDRIJFSFOTO'S</span><h2>Logo en omslagfoto</h2>
      <div className="dealer-media-block"><h3>Logo</h3>{logoUrl?<img className="dealer-profile-logo" src={logoUrl} alt="Bedrijfslogo" loading="lazy"/>:<p className="portal-note">Nog geen logo.</p>}
       <form action={uploadGarageMedia} className="portal-form"><input type="hidden" name="kind" value="logo"/><label>Logo (max. 3 MB)<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required/></label><button className="portal-button portal-button-secondary">Logo opslaan</button></form></div>
      <div className="dealer-media-block"><h3>Omslagfoto</h3>{coverUrl?<img className="dealer-profile-cover" src={coverUrl} alt="Omslagfoto garage" loading="lazy"/>:<p className="portal-note">Nog geen omslagfoto.</p>}
       <form action={uploadGarageMedia} className="portal-form"><input type="hidden" name="kind" value="cover"/><label>Omslagfoto (max. 3 MB)<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required/></label><button className="portal-button portal-button-secondary">Foto opslaan</button></form></div>
    </aside>
   </div>
  </div>
 </div>;
}
