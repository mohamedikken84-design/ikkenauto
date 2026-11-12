"use server";
import {randomUUID} from "node:crypto";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {createSupabaseServer} from "@/lib/supabase/server";
import {parseBelgianEnterpriseNumber} from "@/lib/dealer/kbo";
type State={error:string};
const val=(f:FormData,k:string,max=250)=>String(f.get(k)||"").trim().slice(0,max);
async function owner(){const db=await createSupabaseServer();const {data:{user}}=await db.auth.getUser();if(!user)return {db,dealer:null};const {data:dealer}=await db.from("portal_dealers").select("id,owner_id,logo_path,cover_path").eq("owner_id",user.id).maybeSingle();return {db,dealer};}
export async function saveGarage(_previous:State,form:FormData):Promise<State>{
 const {db,dealer}=await owner();if(!dealer)return {error:"Log opnieuw in."};
 const name=val(form,"name",140),city=val(form,"city",120);
 const entered=val(form,"kbo_number",40);
 const parsed=entered?parseBelgianEnterpriseNumber(entered):null;
 if(parsed&&!parsed.valid)return {error:parsed.error};
 const kbo=parsed?.valid?parsed.normalized:"";
 if(name.length<2||city.length<2)return {error:"Bedrijfsnaam en gemeente zijn verplicht."};

 const website=val(form,"website",250);if(website){try{const u=new URL(website);if(!["https:","http:"].includes(u.protocol))throw Error("protocol");}catch{return {error:"Gebruik een volledige website-URL (https://...)."};}}
 const {error}=await db.from("portal_dealers").update({name,city,kbo_number:kbo||null,postal_code:val(form,"postal_code",12)||null,street:val(form,"street",250)||null,phone:val(form,"phone",40)||null,website:website||null,description:val(form,"description",2500)||null}).eq("id",dealer.id).eq("owner_id",dealer.owner_id);
 if(error)return {error:error.code==="23505"?"Dit ondernemingsnummer hoort al bij een andere garage. Vraag hulp om de vermelding veilig te claimen.":"Garageprofiel opslaan mislukt. Controleer je gegevens."};
 revalidatePath("/portal/garage");revalidatePath("/portal");
 redirect("/portal/garage?success=Garagegegevens+opgeslagen");
}
export async function uploadGarageMedia(form:FormData){
 const {db,dealer}=await owner();if(!dealer)redirect("/portal?aanmelden=1");
 const kind=val(form,"kind",10);if(!["logo","cover"].includes(kind))redirect("/portal/garage?error=Onbekend+fototype");
 const file=form.get("photo");if(!(file instanceof File)||!file.size||file.size>3_000_000||!["image/jpeg","image/png","image/webp"].includes(file.type))redirect("/portal/garage?error=Gebruik+JPG+PNG+of+WebP+tot+3+MB");
 const ext=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";
 const path=dealer.id+"/"+kind+"/"+randomUUID()+"."+ext,store=db.storage.from("portal-garage-media");
 const uploaded=await store.upload(path,Buffer.from(await file.arrayBuffer()),{contentType:file.type,upsert:false});
 if(uploaded.error)redirect("/portal/garage?error=Foto+uploaden+mislukt");
 const field=kind==="logo"?"logo_path":"cover_path",old=kind==="logo"?dealer.logo_path:dealer.cover_path;
 const {error}=await db.from("portal_dealers").update({[field]:path}).eq("id",dealer.id).eq("owner_id",dealer.owner_id);
 if(error){await store.remove([path]);redirect("/portal/garage?error=Foto+opslaan+mislukt");}
 if(old&&old!==path)await store.remove([old]);
 revalidatePath("/portal/garage");redirect("/portal/garage?success=Foto+bijgewerkt");
}
