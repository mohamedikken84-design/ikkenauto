import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
export async function GET(request:Request){
 const url=new URL(request.url);
 const code=url.searchParams.get("code");
 const origin=new URL(request.url).origin;
 if(!code)return NextResponse.redirect(origin+"/portal?error="+encodeURIComponent("Bevestigingslink ontbreekt."));
 const db=await createSupabaseServer();
 const {error}=await db.auth.exchangeCodeForSession(code);
 if(error)return NextResponse.redirect(origin+"/portal?error="+encodeURIComponent("De bevestigingslink is mislukt of verlopen."));
 if(url.searchParams.get("next")==="reset")return NextResponse.redirect(origin+"/portal/wachtwoord/nieuw");
 return NextResponse.redirect(origin+"/portal?success="+encodeURIComponent("E-mailadres bevestigd. Welkom!"));
}