import {connection} from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { updatePassword } from "./actions";
export default async function NewPassword(){
 await connection();
 const db=await createSupabaseServer();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/portal?error="+encodeURIComponent("Vraag een nieuwe herstellink aan."));
 return <article className="mx-auto max-w-xl px-6 py-20"><Link href="/portal">← Terug</Link><h1 className="mt-6 text-4xl font-bold">Nieuw wachtwoord</h1><form action={updatePassword} className="mt-8 grid gap-4"><label>Nieuw wachtwoord (minimaal 10 tekens)<input className="mt-2 w-full rounded border border-gray-300 p-3" type="password" name="password" minLength={10} required autoComplete="new-password"/></label><button className="rounded bg-black p-3 font-semibold text-white">Wachtwoord opslaan</button></form></article>;
}