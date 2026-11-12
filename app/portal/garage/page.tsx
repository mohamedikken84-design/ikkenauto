import Link from "next/link";
import {redirect} from "next/navigation";
import {createSupabaseServer} from "@/lib/supabase/server";
import {GarageProfile} from "./profile";
export default async function GaragePage(){
 const db=await createSupabaseServer();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/portal?mode=login");
 const {data:garage}=await db.from("portal_dealers").select("name,city,phone,postal_code,website,status").eq("owner_id",user.id).maybeSingle();
 if(!garage)redirect("/portal");
 return <div className="portal-container"><Link className="portal-stock-edit" href="/portal">← Terug naar mijn dashboard</Link><div style={{marginTop:22}}><GarageProfile garage={garage}/></div></div>;
}