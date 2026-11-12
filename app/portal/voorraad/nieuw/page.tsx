import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { PortalLogo } from "@/app/portal/portal-logo";
import { VehicleEditor } from "@/app/portal/vehicle-editor";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Auto toevoegen | IKKENAUTO" };

export default async function AddVehiclePage() {
  await connection();
  const db = await createSupabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/portal?aanmelden=1");
  const { data: dealer } = await db.from("portal_dealers").select("id").eq("owner_id", user.id).maybeSingle();
  if (!dealer) redirect("/portal");
  return <div className="portal-shell">
    <header className="portal-top"><PortalLogo/><span className="portal-top-caption">Dealerportaal</span></header>
    <div className="portal-container">
      <Link href="/portal?tab=voertuigen" className="dealer-back-link">← Terug naar mijn voertuigen</Link>
      <VehicleEditor/>
      <footer className="portal-footer dealer-footer">© {new Date().getFullYear()} IKKENAUTO · Alleen toegankelijk voor je garage</footer>
    </div>
  </div>;
}