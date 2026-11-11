"use server";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
export async function requestPasswordReset(form:FormData){
 const email=String(form.get("email")||"").trim().toLowerCase();
 const db=await createSupabaseServer();
 const domain=process.env.PORTAL_ORIGIN || (process.env.VERCEL_URL ? "https://"+process.env.VERCEL_URL : "http://localhost:3000");
 if(email)await db.auth.resetPasswordForEmail(email,{redirectTo:domain+"/portal/auth/callback?next=reset"});
 redirect("/portal?success="+encodeURIComponent("Als dit e-mailadres bestaat, ontvang je een herstelmail."));
}