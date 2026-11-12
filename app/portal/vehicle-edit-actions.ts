"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

type UpdateState = { error: string };
const clean=(f:FormData,k:string,max=250)=>String(f.get(k)??"").trim().slice(0,max);
const number=(f:FormData,k:string)=>{const v=clean(f,k,30).replace(",",".");return v?Number(v):null;};
async function owner() {
 const db=await createSupabaseServer();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return {db,dealerId:null};
 const {data:dealer}=await db.from("portal_dealers").select("id").eq("owner_id",user.id).maybeSingle();
 return {db,dealerId:dealer?.id??null};
}
export async function updateVehicle(_previous:UpdateState,form:FormData):Promise<UpdateState>{
 const {db,dealerId}=await owner();
 if(!dealerId)return {error:"Je sessie is verlopen. Log opnieuw in."};
 const id=clean(form,"vehicle_id",40), make=clean(form,"make",70),model=clean(form,"model",90);
 const price=number(form,"price_eur"),year=number(form,"year"),mileage=number(form,"mileage_km");
 const seats=number(form,"seats"),doors=number(form,"doors"),power=number(form,"power_hp");
 const integer=(n:number|null,min:number,max:number)=>n===null||(Number.isInteger(n)&&n>=min&&n<=max);
 if(!make||!model)return {error:"Merk en model zijn verplicht."};
 if(price===null||!Number.isFinite(price)||price<=0||price>=100000000)return {error:"Geef een geldige verkoopprijs op."};
 if(!integer(year,1900,2100)||!integer(mileage,0,5000000)||!integer(seats,1,30)||!integer(doors,1,10)||!integer(power,1,3000))
   return {error:"Controleer bouwjaar, kilometerstand, zitplaatsen, deuren en vermogen."};
 const {data:found}=await db.from("portal_vehicles").select("id").eq("dealer_id",dealerId).eq("id",id).maybeSingle();
 if(!found)return {error:"Deze auto behoort niet tot je garage."};
 const status=clean(form,"status",12);
 if(!["draft","ready","sold"].includes(status))return {error:"Ongeldige voorraadstatus."};
 const {error}=await db.from("portal_vehicles").update({
  make,model,price_eur:price,year,mileage_km:mileage,seats,doors,power_hp:power,status,
  version:clean(form,"version",150)||null,
  fuel:clean(form,"fuel",50)||null,
  transmission:clean(form,"transmission",50)||null,
  body_type:clean(form,"body_type",60)||null,
  color:clean(form,"color",70)||null,
  emission_class:clean(form,"emission_class",30)||null,
  condition:clean(form,"condition",40)||null,
  source_ref:clean(form,"source_ref",150)||null,
  description:clean(form,"description",4000)||null,
  vat_deductible:form.get("vat_deductible")==="on",
  options:form.getAll("options").map(v=>String(v).slice(0,80)).slice(0,90),
  updated_at:new Date().toISOString()
 }).eq("id",id).eq("dealer_id",dealerId);
 if(error)return {error:"Opslaan mislukt. Controleer het stocknummer en de gegevens."};
 revalidatePath("/portal");
 revalidatePath("/portal/voorraad/"+id+"/bewerken");
 redirect("/portal/voorraad/"+id+"/bewerken?success="+encodeURIComponent("Voertuiggegevens opgeslagen.")+"#vehicle-edit-form");
}
export async function removeVehiclePhoto(form:FormData) {
 const {db,dealerId}=await owner();
 if(!dealerId)redirect("/portal?error=Niet+aangemeld");
 const photoId=clean(form,"photo_id",40),vehicleId=clean(form,"vehicle_id",40);
 const {data:photo}=await db.from("portal_vehicle_photos").select("id,storage_path").eq("id",photoId)
 .eq("vehicle_id",vehicleId).eq("dealer_id",dealerId).maybeSingle();
 if(!photo)redirect("/portal?error=Foto+niet+gevonden");
 const removed=await db.storage.from("portal-vehicles").remove([photo.storage_path]);
 if(removed.error)redirect("/portal?error=Foto+kon+niet+verwijderd+worden");
 const {error}=await db.from("portal_vehicle_photos").delete().eq("id",photo.id).eq("dealer_id",dealerId);
 if(error)redirect("/portal?error=Foto+registratie+kon+niet+bijgewerkt+worden");
 revalidatePath("/portal/voorraad/"+vehicleId+"/bewerken");
 redirect("/portal/voorraad/"+vehicleId+"/bewerken?success=Foto+verwijderd");
}
