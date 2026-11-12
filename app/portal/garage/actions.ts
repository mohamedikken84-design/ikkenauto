"use server";
import {createSupabaseServer} from "@/lib/supabase/server";
import {revalidatePath} from "next/cache";
type Result={error:string;message?:string};
export async function updateGarageProfile(_old:Result,form:FormData):Promise<Result>{
 const db=await createSupabaseServer();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return {error:"Meld je opnieuw aan."};
 const {data:garage}=await db.from("portal_dealers").select("id").eq("owner_id",user.id).maybeSingle();
 if(!garage)return {error:"Je hebt geen garageprofiel."};
 const val=(k:string,n:number)=>String(form.get(k)||"").trim().slice(0,n);
 const name=val("name",140),city=val("city",120),phone=val("phone",40),postal_code=val("postal_code",12),website=val("website",250);
 if(name.length<2||city.length<2)return {error:"Bedrijfsnaam en gemeente zijn verplicht."};
 if(website){try{const url=new URL(website);if(!["https:","http:"].includes(url.protocol))return {error:"Gebruik een geldige website met https://."};}catch{return {error:"Controleer de URL van je website."};}}
 const {error}=await db.from("portal_dealers").update({name,city,phone:phone||null,postal_code:postal_code||null,website:website||null}).eq("id",garage.id).eq("owner_id",user.id);
 if(error)return {error:"Opslaan mislukt. Controleer je gegevens."};
 revalidatePath("/portal");revalidatePath("/portal/garage");
 return {error:"",message:"Garagegegevens opgeslagen. Verificatiestatus is ongewijzigd."};
}