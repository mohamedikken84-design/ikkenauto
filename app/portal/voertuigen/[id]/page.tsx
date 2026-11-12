import {notFound,redirect} from "next/navigation";
import {createSupabaseServer} from "@/lib/supabase/server";
import {EditVehicleForm} from "./edit-form";
export default async function VehicleEdit({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const db=await createSupabaseServer();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/portal?mode=login");
 const {data:dealer}=await db.from("portal_dealers").select("id").eq("owner_id",user.id).maybeSingle();
 if(!dealer)notFound();
 const {data:vehicle,error}=await db.from("portal_vehicles").select("id,make,model,version,price_eur,mileage_km,year,description,status").eq("dealer_id",dealer.id).eq("id",id).maybeSingle();
 if(error||!vehicle)notFound();
 return <EditVehicleForm vehicle={vehicle}/>;
}