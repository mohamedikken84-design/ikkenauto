import Link from "next/link";
import {redirect} from "next/navigation";
import {createSupabaseServer} from "@/lib/supabase/server";
import {QuickImport} from "../../quick-import";
export const metadata={title:"Voorraad importeren · IKKENAUTO"};
export default async function ImportStock(){
 const db=await createSupabaseServer();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/portal?view=login");
 const {data:dealer}=await db.from("portal_dealers").select("id").eq("owner_id",user.id).maybeSingle();
 if(!dealer)redirect("/portal");
 return <main className="portal-shell"><div className="portal-container"><div className="portal-route-head"><Link href="/portal" className="portal-brand"><span>IK</span><span className="portal-brand-gold">K</span><span>ENAUTO</span></Link><span>Dealerportaal</span></div><div className="portal-import-single"><Link href="/portal" className="portal-text-link">← Terug naar dashboard</Link><QuickImport/></div></div></main>;
}