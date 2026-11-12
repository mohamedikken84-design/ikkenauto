"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

function value(form: FormData, key: string, max = 500) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}
function go(message: string, ok = false): never {
  redirect("/portal?" + (ok ? "success=" : "error=") + encodeURIComponent(message));
}
async function current() {
  const db = await createSupabaseServer();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) go("Meld je eerst aan.");
  return { db, user };
}
async function ownDealer() {
  const { db, user } = await current();
  const { data: dealer } = await db.from("portal_dealers").select("id,name").eq("owner_id",user.id).maybeSingle();
  if (!dealer) go("Vul eerst je garagegegevens in.");
  return { db, user, dealer };
}
async function admin() {
  const { db, user } = await current();
  const { data } = await db.from("portal_admins").select("user_id").eq("user_id",user.id).maybeSingle();
  if (!data) go("Geen toegang tot platformbeheer.");
  return db;
}
export async function signIn(form: FormData) {
  const db = await createSupabaseServer();
  const email = value(form,"email",200).toLowerCase();
  const password = value(form,"password",200);
  if (!email || !password) go("Vul je e-mailadres en wachtwoord in.");
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) go("Aanmelden mislukt. Controleer je gegevens of bevestig je e-mail.");
  redirect("/portal");
}
export async function signUp(form: FormData) {
  const db = await createSupabaseServer();
  const email = value(form,"email",200).toLowerCase();
  const password = value(form,"password",200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10) {
    go("Gebruik een geldig e-mailadres en een wachtwoord van minstens 10 tekens.");
  }
  const domain = process.env.PORTAL_ORIGIN || (process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000");
  const { error } = await db.auth.signUp({
    email, password,
    options: { emailRedirectTo: domain + "/portal/auth/callback" },
  });
  if (error) go("Registratie mislukt. Controleer de gegevens.");
  go("Registratie ontvangen. Bevestig je e-mailadres en meld je daarna aan.",true);
}
export async function signOut() {
  const db = await createSupabaseServer();
  await db.auth.signOut();
  redirect("/portal");
}
export async function createDealer(form: FormData) {
  const { db, user } = await current();
  const name = value(form,"name",140), city=value(form,"city",120), email=user.email || "";
  if (name.length < 2 || city.length < 2) go("Vul de bedrijfsnaam en gemeente in.");
  const kbo = value(form,"kbo_number",32).replace(/[\s.]/g,"");
  if (kbo && !/^\d{10}$/.test(kbo)) go("Het ondernemingsnummer moet 10 cijfers bevatten.");
  const { error } = await db.from("portal_dealers").insert({
    owner_id:user.id, name, city, email, kbo_number:kbo || null,
    phone:value(form,"phone",40) || null,
    postal_code:value(form,"postal_code",12) || null,
    website:value(form,"website",250) || null,
  });
  if (error) go("Garage opslaan mislukt. Controleer of je al een garage hebt.");
  revalidatePath("/portal");
  go("Je dealeraccount is klaar. Voeg nu je eerste voertuig toe.",true);
}
function number(form: FormData, key: string) {
  const raw = value(form,key,25).replace(",",".");
  return raw === "" ? null : Number(raw);
}
export async function createVehicle(form: FormData) {
  const { db, dealer } = await ownDealer();
  const make=value(form,"make",70), model=value(form,"model",90);
  const price=number(form,"price_eur"), mileage=number(form,"mileage_km"), year=number(form,"year");
  if (!make || !model || price === null || !Number.isFinite(price) || price < 0 || price > 99999999 ||
    (mileage !== null && (!Number.isInteger(mileage) || mileage < 0)) ||
    (year !== null && (!Number.isInteger(year) || year < 1900 || year > 2100))) {
    go("Controleer merk, model, prijs, kilometerstand en bouwjaar.");
  }
  const { error } = await db.from("portal_vehicles").insert({
    dealer_id:dealer.id, make, model, price_eur:price,
    version:value(form,"version",150)||null, year, mileage_km:mileage,
    fuel:value(form,"fuel",50)||null, transmission:value(form,"transmission",50)||null,
    description:value(form,"description",4000)||null,
    source_ref:value(form,"source_ref",150)||null,
  });
  if (error) go("Auto toevoegen mislukt. Controleer of het stocknummer al bestaat.");
  revalidatePath("/portal");
  go("Auto toegevoegd aan de voorraad.",true);
}
export async function vehicleStatus(form: FormData) {
  const {db,dealer}=await ownDealer();
  const id=value(form,"vehicle_id",40), status=value(form,"status",10);
  if (!["draft","ready","sold"].includes(status)) go("Ongeldige status.");
  const { error } = await db.from("portal_vehicles").update({status,updated_at:new Date().toISOString()})
    .eq("id",id).eq("dealer_id",dealer.id);
  if (error) go("Status aanpassen mislukt.");
  revalidatePath("/portal");
  go("Voorraadstatus bijgewerkt.",true);
}
export async function deleteVehicle(form: FormData) {
  const {db,dealer}=await ownDealer();
  const id=value(form,"vehicle_id",40);
  // First remove private files while storage RLS can still verify vehicle ownership.
  const {data:photos,error:photoError}=await db.from("portal_vehicle_photos").select("storage_path").eq("vehicle_id",id).eq("dealer_id",dealer.id);
  if(photoError)go("Voertuigfoto's konden niet gecontroleerd worden.");
  if(photos?.length){
    const removed=await db.storage.from("portal-vehicles").remove(photos.map(x=>x.storage_path));
    if(removed.error)go("Voertuigfoto's konden niet worden opgeruimd; de auto is niet verwijderd.");
  }
  const {error}=await db.from("portal_vehicles").delete().eq("id",id).eq("dealer_id",dealer.id);
  if(error) go("Auto verwijderen mislukt.");
  revalidatePath("/portal");
  go("Auto verwijderd.",true);
}
// Handles quoted CSV fields, embedded commas and CRLF. Rejects incomplete quoted cells.
function parseCsv(input: string) {
  const delimiter = input.split(/\r?\n/,1)[0]?.includes(";") ? ";" : ",";
  const rows:string[][]=[]; let row:string[]=[],cell="",quoted=false;
  for(let i=0;i<input.length;i++){
    const char=input[i];
    if(char==='"' && quoted && input[i+1]==='"'){cell+='"';i++;}
    else if(char==='"'){quoted=!quoted;}
    else if(char===delimiter && !quoted){row.push(cell);cell="";}
    else if((char==="\n"||char==="\r")&&!quoted){
      if(char==="\r"&&input[i+1]==="\n")i++;
      row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
      row=[];cell="";
    } else cell+=char;
  }
  if(quoted) throw new Error("Niet-gesloten aanhalingsteken.");
  row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
  return rows;
}
export async function importVehicles(form: FormData) {
  const {db,dealer}=await ownDealer();
  const file=form.get("csv");
  if (!(file instanceof File) || file.size===0 || file.size>1_000_000) go("Kies een CSV van maximaal 1 MB.");
  let rows:string[][];
  try{rows=parseCsv(await file.text());}catch{go("Het CSV-formaat is ongeldig.");}
  if(rows.length<2||rows.length>301)go("Het bestand moet 1 tot 300 auto's bevatten.");
  const headers=rows[0].map(x=>x.trim().toLowerCase().replace(/[\s-]/g,"_"));
  function col(row:string[],...names:string[]){const index=headers.findIndex(h=>names.includes(h));return index===-1?"":(row[index]||"").trim();}
  let accepted=0,errors=0;
  for(const row of rows.slice(1)){
    const make=col(row,"merk","make"),model=col(row,"model"),reference=col(row,"stocknummer","stock_id","source_ref","referentie");
    const rawPrice=col(row,"prijs","price","price_eur").replace(/[€\s]/g,"").replace(",",".");
    const price=Number(rawPrice), rawYear=col(row,"jaar","year","bouwjaar");
    const year=rawYear?Number(rawYear):null,rawMileage=col(row,"kilometers","km","mileage_km","kilometerstand");
    const mileage=rawMileage?Number(rawMileage.replace(/[\s.]/g,"")):null;
    if(!make||!model||rawPrice===""||!Number.isFinite(price)||price<0||
      (year!==null&&(!Number.isInteger(year)||year<1900||year>2100))||
      (mileage!==null&&(!Number.isInteger(mileage)||mileage<0))){errors++;continue;}
    const record={
      dealer_id:dealer.id,source_ref:reference||null,make:make.slice(0,70),model:model.slice(0,90),
      price_eur:price,year,mileage_km:mileage,
      version:col(row,"versie","version").slice(0,150)||null,
      fuel:col(row,"brandstof","fuel").slice(0,50)||null,
      transmission:col(row,"transmissie","transmission").slice(0,50)||null,
    };
    const result=reference
      ? await db.from("portal_vehicles").upsert(record,{onConflict:"dealer_id,source_ref"})
      : await db.from("portal_vehicles").insert(record);
    if(result.error)errors++;else accepted++;
  }
  revalidatePath("/portal");
  go(accepted+" voertuigen verwerkt"+(errors?"; "+errors+" rijen overgeslagen":"")+".",true);
}
export async function addProspect(form: FormData) {
  const db=await admin(),name=value(form,"name",140),email=value(form,"email",200);
  if(name.length<2)go("Vul de naam van de autohandelaar in.");
  const {error}=await db.from("portal_prospects").insert({
    name,city:value(form,"city",120)||null,email:email||null,
    phone:value(form,"phone",50)||null,website:value(form,"website",250)||null,
    source_url:value(form,"source_url",500)||null,note:value(form,"note",1000)||null,
  });
  if(error)go("Handelaar toevoegen mislukt.");
  revalidatePath("/portal");go("Handelaar toegevoegd aan je prospecten.",true);
}
export async function setProspectStage(form:FormData) {
  const db=await admin(),id=value(form,"id",40),stage=value(form,"stage",30);
  if(!["nieuw","gecontacteerd","interesse","aangesloten","geen_interesse"].includes(stage))go("Ongeldige opvolgstatus.");
  const {error}=await db.from("portal_prospects").update({stage}).eq("id",id);
  if(error)go("Status wijzigen mislukt.");
  revalidatePath("/portal");go("Opvolgstatus aangepast.",true);
}
export async function setDealerStatus(form:FormData){
  const db=await admin(),id=value(form,"id",40),status=value(form,"status",30);
  if(!["pending","verified","suspended"].includes(status))go("Ongeldige verificatiestatus.");
  const {error}=await db.from("portal_dealers").update({status}).eq("id",id);
  if(error)go("De verificatiestatus kon niet worden aangepast.");
  revalidatePath("/portal");go("Dealerstatus bijgewerkt.",true);
}
