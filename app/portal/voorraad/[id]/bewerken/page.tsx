import {PortalLogo} from "@/app/portal/portal-logo";
import Link from "next/link";
import { connection } from "next/server";
import { redirect, notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { VehicleEditForm } from "@/app/portal/vehicle-edit-form";
import { VehiclePhotoUploader } from "@/app/portal/vehicle-photo-uploader";
import { removeVehiclePhoto } from "@/app/portal/vehicle-edit-actions";
import type { Metadata } from "next";
export const metadata:Metadata={title:"Voertuig bewerken | IKKENAUTO"};
export default async function EditVehicle({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<{success?:string;error?:string}>}){
 await connection();
 const {id}=await params,{success,error}=await searchParams;
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
  <div className="portal-top"><PortalLogo/><span className="portal-top-caption">Voertuigbeheer</span></div>
  <div className="portal-container">
   <Link href="/portal?tab=voertuigen" className="dealer-back-link">← Terug naar mijn voertuigen</Link>
   <div className="portal-heading"><div><span className="portal-overline">{dealer.name} / VOORRAAD</span><h1>{vehicle.make} {vehicle.model}</h1><p>Wijzig de voertuiggegevens en bewaar ze in je voorraad.</p></div></div>
   {success&&<p className="portal-alert portal-success" role="status">{success}</p>}
   {error&&<p className="portal-alert portal-error" role="alert">{error}</p>}
   <div className="portal-grid">
    <article className="portal-card"><span className="portal-overline">VOERTUIGGEGEVENS</span><h2>Bewerken</h2><VehicleEditForm vehicle={vehicle}/></article>
    <aside id="photos" className="portal-card"><span className="portal-overline">FOTO&apos;S</span><h2>Foto&apos;s beheren</h2>
      <p>Upload meerdere foto&apos;s rechtstreeks naar de beveiligde opslag. JPG, PNG of WebP, maximaal 3,5 MB per foto. Je beelden blijven voorlopig privé.</p>
      <VehiclePhotoUploader vehicleId={id} dealerId={dealer.id} currentCount={files?.length||0}/>
      <div className="dealer-photos">{photos.map(photo=><figure key={photo.id}>
       {photo.url?<img src={photo.url} loading="lazy" alt="Voertuigfoto"/>:<span>Foto tijdelijk niet beschikbaar</span>}
       <form action={removeVehiclePhoto}><input type="hidden" name="photo_id" value={photo.id}/><input type="hidden" name="vehicle_id" value={id}/><button className="portal-delete" type="submit">Foto verwijderen</button></form>
      </figure>)}
      {!photos.length&&<p className="portal-empty">Nog geen foto&apos;s toegevoegd.</p>}</div>
    </aside>
   </div>
  </div>
 </section>;
}
