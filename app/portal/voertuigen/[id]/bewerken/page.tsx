import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {createSupabaseServer} from "@/lib/supabase/server";
import {VehicleEditor} from "../../../vehicle-editor";
export const metadata={title:"Voertuig bewerken · IKKENAUTO"};
export default async function EditVehicle({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
 const db=await createSupabaseServer();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/portal?view=login");
 const {data:dealer}=await db.from("portal_dealers").select("id").eq("owner_id",user.id).maybeSingle();
 if(!dealer)redirect("/portal");
 const {data, error}=await db.from("portal_vehicles").select("*").eq("id",id).eq("dealer_id",dealer.id).maybeSingle();
 if(error||!data)notFound();
 const record:Record<string,string>={};
 for(const [key,val] of Object.entries(data))if(typeof val==="string"||typeof val==="number")record[key]=String(val);
 record.vat_deductible=data.vat_deductible?"on":"";
 return <main className="portal-shell"><div className="portal-container"><div className="portal-route-head"><Link href="/portal" className="portal-brand"><span>IK</span><span className="portal-brand-gold">K</span><span>ENAUTO</span></Link><span>Dealerportaal</span></div><VehicleEditor vehicleId={id} initial={{...record,options:Array.isArray(data.options)?data.options:[]}}/></div></main>;
}