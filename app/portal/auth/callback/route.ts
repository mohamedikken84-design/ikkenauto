import {NextResponse} from "next/server";
import type {EmailOtpType} from "@supabase/supabase-js";
import {createSupabaseServer} from "@/lib/supabase/server";
const allowedTypes:EmailOtpType[]=["signup","invite","magiclink","recovery","email_change","email"];
export async function GET(request:Request){
 const url=new URL(request.url),base=url.origin;
 const code=url.searchParams.get("code"),hash=url.searchParams.get("token_hash"),type=url.searchParams.get("type");
 const db=await createSupabaseServer();
 let verified=false;
 if(code){
  const {error}=await db.auth.exchangeCodeForSession(code);
  verified=!error;
 }else if(hash&&type&&allowedTypes.includes(type as EmailOtpType)){
  const {error}=await db.auth.verifyOtp({token_hash:hash,type:type as EmailOtpType});
  verified=!error;
 }
 if(!verified)return NextResponse.redirect(base+"/portal?error="+encodeURIComponent("Deze bevestigings- of herstellink is ongeldig of verlopen. Vraag een nieuwe link aan."));
 if(type==="recovery"||url.searchParams.get("next")==="reset")
  return NextResponse.redirect(base+"/portal/wachtwoord/nieuw");
 return NextResponse.redirect(base+"/portal?success="+encodeURIComponent("Uw e-mailadres is bevestigd. U kunt uw garage registreren."));
}
