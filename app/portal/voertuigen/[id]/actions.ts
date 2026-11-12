"use server";
import {revalidatePath} from "next/cache";
import {createSupabaseServer} from "@/lib/supabase/server";
type State={error:string;message?:string};
export async function updateOwnVehicle(_previous:State,form:FormData):Promise<State>{
 const db=await createSupabaseServer();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return {error:"Je sessie is verlopen. Meld je opnieuw aan."};
 const id=String(form.get("id")||"");
 if(!/^[0-9a-f-]{36}$/i.test(id))return {error:"Ongeldig voertuig."};
 const {data:dealer}=await db.from("portal_dealers").select("id").eq("owner_id",user.id).maybeSingle();
 if(!dealer)return {error:"Geen toegang tot deze garage."};
 const {data:vehicle}=await db.from("portal_vehicles").select("id").eq("id",id).eq("dealer_id",dealer.id).maybeSingle();
 if(!vehicle)return {error:"Dit voertuig hoort niet bij jouw garage."};
 const make=String(form.get("make")||"").trim().slice(0,70);
 const model=String(form.get("model")||"").trim().slice(0,90);
 const price=Number(String(form.get("price_eur")||"").replace(",","."));
 const kmRaw=String(form.get("mileage_km")||"").trim(),mileage=kmRaw?Number(kmRaw):null;
 const yearRaw=String(form.get("year")||"").trim(),year=yearRaw?Number(yearRaw):null;
 const status=String(form.get("status")||"draft");
 if(!make||!model)return {error:"Merk en model zijn verplicht."};
 if(!Number.isFinite(price)||price<0||price>=100000000)return {error:"Vul een geldige prijs in."};
 if(mileage!==null&&(!Number.isInteger(mileage)||mileage<0||mileage>5000000))return {error:"Controleer de kilometerstand."};
 if(year!==null&&(!Number.isInteger(year)||year<1900||year>2100))return {error:"Controleer het bouwjaar."};
 if(!["draft","ready","sold"].includes(status))return {error:"Ongeldige voertuigstatus."};
 const {error}=await db.from("portal_vehicles").update({
  make,model,price_eur:price,mileage_km:mileage,year,status,
  version:String(form.get("version")||"").trim().slice(0,150)||null,
  description:String(form.get("description")||"").trim().slice(0,4000)||null,
  updated_at:new Date().toISOString()
 }).eq("id",id).eq("dealer_id",dealer.id);
 if(error)return {error:"Wijzigingen zijn niet opgeslagen. Probeer het opnieuw."};
 revalidatePath("/portal");
 revalidatePath("/portal/voertuigen/"+id);
 return {error:"",message:"Wijzigingen opgeslagen. Het voertuig blijft privé tot de publieke lancering."};
}