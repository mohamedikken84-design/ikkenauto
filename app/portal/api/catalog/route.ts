import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseBrowserConfig } from "@/lib/supabase/env";

export const runtime = "nodejs";
type Table = "portal_vehicle_makes" | "portal_vehicle_models" | "portal_vehicle_generations" | "portal_vehicle_powertrains" | "portal_vehicle_trims";
const children: Record<string, { table: Table; column: string }> = {
  models: { table: "portal_vehicle_models", column: "make_id" },
  generations: { table: "portal_vehicle_generations", column: "model_id" },
  powertrains: { table: "portal_vehicle_powertrains", column: "generation_id" },
  trims: { table: "portal_vehicle_trims", column: "powertrain_id" },
};
const headers = { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "initial";
  const key = url.searchParams.get("parent") || "";
  const config = supabaseBrowserConfig();
  if (!config) return NextResponse.json({ error: "Catalogus niet beschikbaar" }, { status: 503 });
  const db = createClient(config.url, config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  if (type === "initial") {
    const [makes, equipment] = await Promise.all([
      db.from("portal_vehicle_makes").select("id,name,verified").order("name").limit(250),
      db.from("portal_vehicle_equipment_catalog").select("code,label_nl,category,compatible_fuels").eq("enabled",true).order("category").order("label_nl").limit(500),
    ]);
    if (makes.error || equipment.error) return NextResponse.json({ error: "Catalogus tijdelijk niet beschikbaar" }, { status: 503 });
    return NextResponse.json({ makes: makes.data || [], equipment: equipment.data || [] }, { headers });
  }

  const spec = children[type];
  if (!spec || !/^[1-9][0-9]{0,14}$/.test(key)) {
    return NextResponse.json({ error: "Ongeldige catalogusaanvraag" }, { status: 400 });
  }
  const selectByType: Record<string,string> = {
      models: "id,name,verified",
      generations: "id,code,year_from,year_to,verified",
      powertrains: "id,name,fuel,power_kw,verified",
      trims: "id,name,verified",
  };
  const retry = await db.from(spec.table).select(selectByType[type]).eq(spec.column,Number(key))
      .order(type==="generations"?"year_from":"name",{ascending:type!=="generations"}).limit(250);
  if (retry.error) return NextResponse.json({ error: "Catalogus kan niet worden geladen" }, { status: 503 });
  return NextResponse.json({items:retry.data || []},{headers});
}
