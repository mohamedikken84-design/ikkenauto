"use server";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { portalOrigin } from "@/lib/portal-origin";
export async function requestPasswordReset(form:FormData){
 const email=String(form.get("email")||"").trim().toLowerCase();
 const db=await createSupabaseServer();
 const domain=await portalOrigin();
 if(email)await db.auth.resetPasswordForEmail(email,{redirectTo:domain+"/portal/auth/callback?next=reset"});
 redirect("/portal?success="+encodeURIComponent("Als dit e-mailadres bestaat, ontvang je een herstelmail."));
}