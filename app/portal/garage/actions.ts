"use server";
import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createSupabaseServer} from "@/lib/supabase/server";

const message=(msg:string,error=false):never=>redirect("/portal/garage?"+(error?"error=":"success=")+encodeURIComponent(msg));
const val=(form:FormData,key:string,max=200)=>String(form.get(key)||"").trim().slice(0,max);
async function ownGarage(){
 const db=await createSupabaseServer();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/portal?view=login");
 const {data:garage}=await db.from("portal_dealers").select("id,owner_id").eq("owner_id",user.id).maybeSingle();
 if(!garage)redirect("/portal");
 return {db,garage};
}
export async function updateGarageProfile(form:FormData){
 const {db,garage}=await ownGarage();
 const name=val(form,"name",140),city=val(form,"city",120),description=val(form,"description",1500);
 const website=val(form,"website",250);
 if(name.length<2||city.length<2)message("Bedrijfsnaam en gemeente zijn verplicht.",true);
 if(website){try{const u=new URL(website);if(!["https:","http:"].includes(u.protocol))throw Error("bad");}catch{message("Gebruik een geldig websiteadres dat met https:// begint.",true);}}
 const {error}=await db.from("portal_dealers").update({
  name,city,description:description||null,website:website||null,
  phone:val(form,"phone",40)||null,postal_code:val(form,"postal_code",12)||null,street:val(form,"street",240)||null
 }).eq("id",garage.id).eq("owner_id",garage.owner_id);
 if(error)message("Uw gegevens konden niet worden opgeslagen.",true);
 revalidatePath("/portal");revalidatePath("/portal/garage");
 message("Garageprofiel bijgewerkt.");
}
function isImage(bytes:Buffer,type:string){
 if(type==="image/jpeg")return bytes.length>3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
 if(type==="image/png")return bytes.length>8&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 if(type==="image/webp")return bytes.length>12&&bytes.toString("ascii",0,4)==="RIFF"&&bytes.toString("ascii",8,12)==="WEBP";
 return false;
}
export async function uploadGarageImage(form:FormData){
 const {db,garage}=await ownGarage();
 const kind=val(form,"kind",8);
 if(kind!=="logo"&&kind!=="cover")message("Ongeldige upload.",true);
 const file=form.get("image");
 if(!(file instanceof File)||file.size<100||file.size>3_000_000||
  !["image/jpeg","image/png","image/webp"].includes(file.type))message("Kies een JPG-, PNG- of WebP-afbeelding van maximaal 3 MB.",true);
 const bytes=Buffer.from(await (file as File).arrayBuffer());
 if(!isImage(bytes,(file as File).type))message("De afbeelding is ongeldig.",true);
 const extension=(file as File).type==="image/jpeg"?"jpg":(file as File).type==="image/png"?"png":"webp";
 const path=garage.id+"/"+kind+"-"+randomUUID()+"."+extension;
 const uploaded=await db.storage.from("portal-garage-media").upload(path,bytes,{contentType:(file as File).type,upsert:false});
 if(uploaded.error)message("Uploaden mislukt. Probeer het opnieuw.",true);
 const column=kind==="logo"?"logo_path":"cover_path";
 const {error}=await db.from("portal_dealers").update({[column]:path}).eq("id",garage.id).eq("owner_id",garage.owner_id);
 if(error){await db.storage.from("portal-garage-media").remove([path]);message("Het bestand kon niet worden gekoppeld.",true);}
 revalidatePath("/portal/garage");
 message(kind==="logo"?"Logo opgeslagen.":"Omslagfoto opgeslagen.");
}
