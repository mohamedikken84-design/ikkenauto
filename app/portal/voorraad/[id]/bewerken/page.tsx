import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { VehicleEditForm } from "@/app/portal/vehicle-edit-form";
import { uploadVehiclePhoto } from "@/app/portal/actions";
import { removeVehiclePhoto } from "@/app/portal/vehicle-edit-actions";
import type { Metadata } from "next";
export const metadata:Metadata={title:"Voertuig bewerken | IKKENAUTO"};
export default async function EditVehicle({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<{success?:string}>}){
 const {id}=await params,{success}=await searchParams;
 const db=await createSupabaseServer();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/portal?aanmelden=1");
 const {data:dealer}=await db.from("portal_dealers").select("id,name").eq("owner_id",user.id).maybeSingle();
 if(!dealer)redirect("/portal");
 const {data:vehicle}=await db.from("portal_vehicles").select("*").eq("id",id).eq("dealer_id",dealer.id).maybeSingle();
 if(!vehicle)notFound();
 const {data:files}=await db.from("portal_vehicle_photos").select("id,storage_path").eq("vehicle_id",id).eq("dealer_id",dealer.id).order("created_at",{ascending:true}).limit(25);
 const photos=await Promise.all((files||[]).map(async p=>({
   id:p.id,url:(await db.storage.from("portal-vehicles").createSignedUrl(p.storage_path,3600)).data?.signedUrl||null
 })));
 return <section className="portal-shell">
  <div className="portal-top"><Link className="portal-brand" href="/portal"><span>IK</span><span className="portal-brand-gold">K</span><span>ENAUTO</span><small>.BE</small></Link><span className="portal-top-caption">Voertuigbeheer</span></div>
  <div className="portal-container">
   <Link href="/portal" className="dealer-back-link">← Terug naar mijn voorraad</Link>
   <div className="portal-heading"><div><span className="portal-overline">{dealer.name} / VOORRAAD</span><h1>{vehicle.make} {vehicle.model}</h1><p>Wijzig de voertuiggegevens en bewaar ze in je voorraad.</p></div></div>
   {success&&<p className="portal-alert portal-success" role="status">{success}</p>}
   <div className="portal-grid">
    <article className="portal-card"><span className="portal-overline">VOERTUIGGEGEVENS</span><h2>Bewerken</h2><VehicleEditForm vehicle={vehicle}/></article>
    <aside className="portal-card"><span className="portal-overline">FOTO'S</span><h2>Foto's beheren</h2>
      <p>JPG, PNG of WebP, maximaal 3,5 MB per bestand. Foto's zijn alleen toegankelijk voor je garage tijdens de voorbereiding.</p>
      <form action={uploadVehiclePhoto} className="portal-form">
       <input type="hidden" name="vehicle_id" value={id}/>
       <label>Foto toevoegen<input type="file" name="photo" required accept="image/jpeg,image/png,image/webp"/></label>
       <button type="submit" className="portal-button portal-button-secondary">Foto uploaden</button>
      </form>
      <div className="dealer-photos">{photos.map(photo=><figure key={photo.id}>
       {photo.url?<img src={photo.url} loading="lazy" alt="Voertuigfoto"/>:<span>Foto tijdelijk niet beschikbaar</span>}
       <form action={removeVehiclePhoto}><input type="hidden" name="photo_id" value={photo.id}/><input type="hidden" name="vehicle_id" value={id}/><button className="portal-delete" type="submit">Foto verwijderen</button></form>
      </figure>)}
      {!photos.length&&<p className="portal-empty">Nog geen foto's toegevoegd.</p>}</div>
    </aside>
   </div>
  </div>
 </section>;
}
