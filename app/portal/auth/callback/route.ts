import {NextResponse} from "next/server";
import {createSupabaseServer} from "@/lib/supabase/server";

export async function GET(request:Request){
 const url=new URL(request.url);
 const db=await createSupabaseServer();
 const code=url.searchParams.get("code");
 const tokenHash=url.searchParams.get("token_hash");
 const type=url.searchParams.get("type");
 if(code){
  const {error}=await db.auth.exchangeCodeForSession(code);
  if(error)return NextResponse.redirect(url.origin+"/portal?error="+encodeURIComponent("De bevestigingslink is ongeldig of verlopen."));
 }else if(tokenHash&&(type==="email"||type==="signup"||type==="recovery")){
  const {error}=await db.auth.verifyOtp({token_hash:tokenHash,type:type==="signup"?"email":type});
  if(error)return NextResponse.redirect(url.origin+"/portal?error="+encodeURIComponent("De bevestigingslink is ongeldig of verlopen."));
 }else{
  return NextResponse.redirect(url.origin+"/portal?error="+encodeURIComponent("Bevestigingsgegevens ontbreken."));
 }
 if(url.searchParams.get("next")==="reset"||type==="recovery")
   return NextResponse.redirect(url.origin+"/portal/wachtwoord/nieuw");
 return NextResponse.redirect(url.origin+"/portal?success="+encodeURIComponent("E-mailadres bevestigd."));
}
