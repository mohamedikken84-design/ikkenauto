"use server";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
export async function updatePassword(form:FormData){
 const db=await createSupabaseServer();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/portal?error="+encodeURIComponent("Je sessie is verlopen."));
 const password=String(form.get("password")||"");
 if(password.length<10||password.length>200)redirect("/portal?error="+encodeURIComponent("Het nieuwe wachtwoord moet minstens 10 tekens hebben."));
 const {error}=await db.auth.updateUser({password});
 if(error)redirect("/portal?error="+encodeURIComponent("Wachtwoord opslaan mislukt."));
 redirect("/portal?success="+encodeURIComponent("Wachtwoord gewijzigd."));
}