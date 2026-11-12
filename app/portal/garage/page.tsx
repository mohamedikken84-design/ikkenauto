import Link from "next/link";
import {redirect} from "next/navigation";
import {createSupabaseServer} from "@/lib/supabase/server";
import {updateGarageProfile,uploadGarageImage} from "./actions";
export const metadata={title:"Mijn garageprofiel · IKKENAUTO"};
export default async function GarageProfile({searchParams}:{searchParams:Promise<{success?:string;error?:string}>}){
 const query=await searchParams;
 const db=await createSupabaseServer();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/portal?view=login");
 const {data:dealer}=await db.from("portal_dealers").select("id,name,city,phone,postal_code,street,website,kbo_number,email,description,logo_path,cover_path,status").eq("owner_id",user.id).maybeSingle();
 if(!dealer)redirect("/portal");
 async function signed(path:string|null){if(!path)return null;const {data}=await db.storage.from("portal-garage-media").createSignedUrl(path,600);return data?.signedUrl||null;}
 const [logo,cover]=await Promise.all([signed(dealer.logo_path),signed(dealer.cover_path)]);
 return <main className="portal-shell"><div className="portal-container">
 <div className="portal-route-head"><Link href="/portal" className="portal-brand"><span>IK</span><span className="portal-brand-gold">K</span><span>ENAUTO</span></Link><Link href="/portal" className="portal-text-link">Terug naar dashboard</Link></div>
 <div className="portal-profile"><span className="portal-overline">MIJN GARAGE</span><h1>Garageprofiel</h1><p>Uw gegevens blijven privé tijdens de voorbereidingsfase. Alleen geverifieerde en toegestane informatie wordt bij een toekomstige publieke lancering zichtbaar.</p>
 {query.error&&<p className="portal-form-error" role="alert">{query.error}</p>}
 {query.success&&<p className="portal-form-ok" role="status">{query.success}</p>}
 <div className="portal-profile-grid">
 <section className="portal-card"><h2>Bedrijfsgegevens</h2><p>Accountstatus: <strong>{dealer.status==="verified"?"Geverifieerd":dealer.status==="pending"?"In beoordeling":"Geblokkeerd"}</strong></p>
 <form className="portal-form portal-fields" action={updateGarageProfile}>
  <label>Bedrijfsnaam *<input name="name" defaultValue={dealer.name} required/></label>
  <label>Gemeente *<input name="city" defaultValue={dealer.city} required/></label>
  <label>Adres<input name="street" defaultValue={dealer.street||""}/></label>
  <label>Postcode<input name="postal_code" defaultValue={dealer.postal_code||""}/></label>
  <label>Telefoon<input name="phone" type="tel" defaultValue={dealer.phone||""}/></label>
  <label>Website<input name="website" type="url" defaultValue={dealer.website||""} placeholder="https://www.garage.be"/></label>
  <label>Ondernemingsnummer<input value={dealer.kbo_number||"Niet ingevuld"} disabled/></label>
  <label>E-mail<input value={dealer.email} disabled/></label>
  <label className="portal-full">Over de garage<textarea name="description" rows={4} maxLength={1500} defaultValue={dealer.description||""}/></label>
  <button className="portal-primary portal-full" type="submit">Gegevens opslaan</button>
 </form></section>
 <section className="portal-card"><h2>Logo en omslagfoto</h2><p>Een professioneel logo en een foto van uw garage versterken het profiel bij de latere lancering.</p>
 <div className="portal-profile-media">{logo?<img src={logo} alt={"Logo van "+dealer.name}/>:<div className="portal-media-placeholder">Nog geen logo</div>}</div>
 <form className="portal-form" action={uploadGarageImage}><input type="hidden" name="kind" value="logo"/><label>Logo uploaden<input type="file" name="image" accept="image/png,image/jpeg,image/webp" required/></label><button className="portal-secondary">Logo opslaan</button></form>
 <div className="portal-profile-media portal-cover-media">{cover?<img src={cover} alt={"Omslagfoto van "+dealer.name}/>:<div className="portal-media-placeholder">Nog geen omslagfoto</div>}</div>
 <form className="portal-form" action={uploadGarageImage}><input type="hidden" name="kind" value="cover"/><label>Omslagfoto uploaden<input type="file" name="image" accept="image/png,image/jpeg,image/webp" required/></label><button className="portal-secondary">Omslagfoto opslaan</button></form>
 <p className="portal-note">JPG, PNG of WebP · maximaal 3 MB per afbeelding.</p></section>
 </div></div></div></main>;
}