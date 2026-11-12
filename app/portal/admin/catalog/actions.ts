"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createSupabaseServer} from "@/lib/supabase/server";
const types=["make","model","generation","powertrain","trim"] as const;
type Kind=typeof types[number];
const value=(form:FormData,key:string,max=160)=>String(form.get(key)||"").trim().slice(0,max);
const fail=(message:string):never=>redirect("/portal/admin/catalog?error="+encodeURIComponent(message));
const done=(message:string):never=>redirect("/portal/admin/catalog?success="+encodeURIComponent(message));
function parseId(form:FormData,key:string){
 const s=value(form,key,20),id=Number(s);
 return /^\d+$/.test(s)&&Number.isSafeInteger(id)&&id>0?id:null;
}
export async function addCatalogEntry(form:FormData){
 const db=await createSupabaseServer();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return fail("Meld je aan als platformbeheerder.");
 const {data:admin}=await db.from("portal_admins").select("user_id").eq("user_id",user.id).maybeSingle();
 if(!admin)return fail("Geen toegang tot catalogusbeheer.");
 const type=value(form,"type",30) as Kind;
 if(!types.includes(type))return fail("Onbekend catalogusniveau.");
 const name=value(form,"name");
 if(name.length<2)return fail("Vul een naam of modelcode van minstens twee tekens in.");
 let errorMessage="";
 if(type==="make"){
  const slug=name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,100);
  const result=await db.from("portal_vehicle_makes").insert({name,slug,verified:false,source_note:"Manueel ingevoerd door IKKENAUTO beheerder"});
  errorMessage=result.error?.message||"";
 }else if(type==="model"){
  const makeId=parseId(form,"make_id");if(!makeId)return fail("Kies eerst een merk.");
  const result=await db.from("portal_vehicle_models").insert({name,make_id:makeId,verified:false});
  errorMessage=result.error?.message||"";
 }else if(type==="generation"){
  const modelId=parseId(form,"model_id");if(!modelId)return fail("Kies eerst het juiste model.");
  const from=Number(value(form,"year_from",4));const to=Number(value(form,"year_to",4));
  if((from&&(from<1900||from>2100))||(to&&(to<1900||to>2100))||(from&&to&&to<from))return fail("Controleer de bouwjaren.");
  const result=await db.from("portal_vehicle_generations").insert({
   model_id:modelId,code:name,year_from:from||null,year_to:to||null,verified:false,
  });
  errorMessage=result.error?.message||"";
 }else if(type==="powertrain"){
  const id=parseId(form,"generation_id");if(!id)return fail("Kies eerst een generatie.");
  const result=await db.from("portal_vehicle_powertrains").insert({generation_id:id,name,verified:false});
  errorMessage=result.error?.message||"";
 }else if(type==="trim"){
  const id=parseId(form,"powertrain_id");if(!id)return fail("Kies eerst de motorisatie.");
  const result=await db.from("portal_vehicle_trims").insert({powertrain_id:id,name,verified:false});
  errorMessage=result.error?.message||"";
 }
 if(errorMessage)return fail(errorMessage.includes("duplicate key")?"Dit item bestaat al.": "Catalogusitem niet opgeslagen. Controleer de bovenliggende keuze.");
 revalidatePath("/portal/admin/catalog");
 return done("Catalogusitem toegevoegd. Het is pas geverifieerd na bronnencontrole.");
}
