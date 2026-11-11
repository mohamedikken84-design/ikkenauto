"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

type Result = { error: string; message?:string };
const ok:Result={error:""};
function field(form:FormData,name:string,max=250){return String(form.get(name)??"").trim().slice(0,max);}
function origin(){return (process.env.PORTAL_ORIGIN||"https://ikkenauto-cursor-keep-alive-6ada.vercel.app").replace(/\/$/,"");}
async function authenticate(){
 const db=await createSupabaseServer();
 const {data:{user}}=await db.auth.getUser();
 return {db,user};
}
async function requireAdmin(){
 const {db,user}=await authenticate();
 if(!user)throw Error("Niet aangemeld");
 const {data}=await db.from("portal_admins").select("user_id").eq("user_id",user.id).maybeSingle();
 if(!data)throw Error("Geen adminrechten");
 return db;
}
async function getDealer(){
 const {db,user}=await authenticate();
 if(!user)throw Error("Niet aangemeld");
 const {data}=await db.from("portal_dealers").select("id").eq("owner_id",user.id).maybeSingle();
 if(!data)throw Error("Maak eerst je garageprofiel aan");
 return {db, user, dealerId:String(data.id)};
}
export async function loginChecked(_previous:Result,form:FormData):Promise<Result>{
 const db=await createSupabaseServer(),email=field(form,"email",200).toLowerCase(),password=field(form,"password",200);
 if(!email||!password)return {error:"Vul e-mailadres en wachtwoord in."};
 const {error}=await db.auth.signInWithPassword({email,password});
 if(error)return {error:"Inloggen mislukt. Controleer je gegevens of bevestig eerst je e-mailadres."};
 redirect("/portal");
}
export async function registerChecked(_previous:Result,form:FormData):Promise<Result>{
 const db=await createSupabaseServer(),email=field(form,"email",200).toLowerCase(),password=field(form,"password",200);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {error:"Controleer het e-mailadres."};
 if(password.length<10)return {error:"Gebruik een wachtwoord van minstens 10 tekens."};
 const {error}=await db.auth.signUp({email,password,options:{emailRedirectTo:origin()+"/portal/auth/callback"}});
 if(error)return {error:"Registreren lukt momenteel niet. Controleer je gegevens of probeer later opnieuw."};
 return {error:"",message:"Account aangemaakt. Controleer je mailbox en bevestig je e-mailadres."};
}
function kboValid(raw:string){
 const v=raw.replace(/\D/g,"");
 if(!v)return true;
 if(v.length!==10)return false;
 return (97-(Number(v.slice(0,8))%97))===Number(v.slice(8));
}
export async function dealerChecked(_previous:Result,form:FormData):Promise<Result>{
 const {db,user}=await authenticate();
 if(!user)return {error:"Je moet eerst aanmelden."};
 const name=field(form,"name",140),city=field(form,"city",120),kbo=field(form,"kbo_number",30).replace(/\D/g,"");
 if(name.length<2)return {error:"Vul de juiste bedrijfsnaam in."};
 if(city.length<2)return {error:"Vul je gemeente in."};
 if(!kboValid(kbo))return {error:"Het Belgische ondernemingsnummer is niet geldig. Controleer de 10 cijfers."};
 const {error}=await db.from("portal_dealers").insert({owner_id:user.id,name,city,email:user.email||"",kbo_number:kbo||null,
  phone:field(form,"phone",40)||null,postal_code:field(form,"postal_code",12)||null,website:field(form,"website",250)||null});
 if(error)return {error:"De garage kon niet worden opgeslagen. Controleer je gegevens."};
 const directoryRow=Number(field(form,"directory_row",8));
 if(Number.isInteger(directoryRow)&&directoryRow>0){
  await db.from("portal_directory_claims").insert({source_row:directoryRow,user_id:user.id,evidence:"Gevonden bij dealerregistratie; verificatie vereist."});
 }
 revalidatePath("/portal");
 redirect("/portal?success="+encodeURIComponent("Garageprofiel opgeslagen. Je kunt nu auto's toevoegen."));
}
const makes=["Abarth","Alfa Romeo","Alpine","Aston Martin","Audi","Bentley","BMW","BYD","Cadillac","Chevrolet","Chrysler","Citroën","Cupra","Dacia","Daewoo","Daihatsu","Dodge","DS","Ferrari","Fiat","Fisker","Ford","Genesis","Honda","Hyundai","Infiniti","Isuzu","Jaguar","Jeep","Kia","Lamborghini","Lancia","Land Rover","Lexus","Lotus","Maserati","Mazda","McLaren","Mercedes-Benz","MG","MINI","Mitsubishi","Nissan","Opel","Peugeot","Polestar","Porsche","Renault","Rolls-Royce","Saab","SEAT","Skoda","Smart","Subaru","Suzuki","Tesla","Toyota","Volkswagen","Volvo","Xpeng","Zeekr"];
const choices=["Airconditioning","Automatische klimaatregeling","Cruisecontrol","Adaptieve cruisecontrol","Navigatie","Apple CarPlay","Android Auto","Achteruitrijcamera","Parkeersensoren voor","Parkeersensoren achter","Ledkoplampen","Matrix-led","Panoramadak","Trekhaak","Verwarmde zetels","Elektrische zetels","Lederen bekleding","Isofix","Dodehoekwaarschuwing","Rijstrookassistent","Keyless entry","Elektrische achterklep","Bluetooth","Head-updisplay","360° camera","Sportpakket","Lichtmetalen velgen"];
export async function vehicleChecked(_previous:Result,form:FormData):Promise<Result>{
 let context:Awaited<ReturnType<typeof getDealer>>;
 try{context=await getDealer();}catch{return {error:"Meld je aan en maak eerst je dealerprofiel aan."};}
 const {db,dealerId}=context,make=field(form,"make",70),model=field(form,"model",90);
 const price=Number(field(form,"price_eur",20).replace(",",".")),year=Number(field(form,"year",12));
 const mileage=Number(field(form,"mileage_km",12)),seats=Number(field(form,"seats",2)),doors=Number(field(form,"doors",2));
 const power=Number(field(form,"power_hp",5)),options=form.getAll("options").map(x=>String(x)).filter(x=>choices.includes(x));
 if(!make||!model)return {error:"Merk en model zijn verplicht."};
 if(!Number.isFinite(price)||price<=0||price>100000000)return {error:"Vul een geldige verkoopprijs in."};
 if(!Number.isInteger(year)||year<1900||year>2100)return {error:"Vul een geldig bouwjaar in."};
 if(!Number.isInteger(mileage)||mileage<0||mileage>5000000)return {error:"Vul een geldige kilometerstand in."};
 if((seats&&!Number.isInteger(seats))||(seats<0||seats>30)||(doors&&(doors<1||doors>10)))return {error:"Controleer deuren en zitplaatsen."};
 if(power&&(!Number.isInteger(power)||power<1||power>3000))return {error:"Controleer het vermogen."};
 const record={
  dealer_id:dealerId,make,model,version:field(form,"version",150)||null,
  price_eur:price,year,mileage_km:mileage,
  fuel:field(form,"fuel",50)||null, transmission:field(form,"transmission",50)||null,
  body_type:field(form,"body_type",60)||null, seats:seats||null,doors:doors||null,power_hp:power||null,
  color:field(form,"color",70)||null,interior_color:field(form,"interior_color",70)||null,
  drivetrain:field(form,"drivetrain",50)||null,condition:field(form,"condition",40)||null,
  emission_class:field(form,"emission_class",30)||null,
  first_registration:field(form,"first_registration",20)||null,
  vin:field(form,"vin",32)||null,description:field(form,"description",4000)||null,
  source_ref:field(form,"source_ref",150)||null,
  vat_deductible:form.get("vat_deductible")==="on",options
 };
 const {error}=await db.from("portal_vehicles").insert(record);
 if(error)return {error:"Auto niet opgeslagen. Controleer of je stocknummer al bestaat."};
 revalidatePath("/portal");
 redirect("/portal?success="+encodeURIComponent("Auto opgeslagen."));
}
export async function queueExternalLink(_previous:Result,form:FormData):Promise<Result>{
 let ctx:Awaited<ReturnType<typeof getDealer>>;
 try{ctx=await getDealer();}catch{return {error:"Log in bij je garage."};}
 const url=field(form,"source_url",700);
 let parsed:URL;
 try{parsed=new URL(url);}catch{return {error:"Vul een volledige https-link naar de auto in."};}
 const host=parsed.hostname.toLowerCase().replace(/^www\./,"");
 if(parsed.protocol!=="https:"||!["autoscout24.be","2dehands.be"].some(v=>host===v||host.endsWith("."+v)))
  return {error:"Gebruik een https-link van autoscout24.be of 2dehands.be."};
 const source=host.endsWith("autoscout24.be")?"autoscout24":"2dehands";
 const {error}=await ctx.db.from("portal_import_links").insert({dealer_id:ctx.dealerId,source,source_url:parsed.href});
 if(error)return {error:"Link kon niet worden toegevoegd of is al aanwezig."};
 revalidatePath("/portal");
 return {error:"",message:"Link bewaard voor importcontrole. Automatisch uitlezen is nog niet geactiveerd."};
}
function parseCsv(data:string){
 const head=data.split(/\r?\n/,1)[0];const delimiter=head.includes(";")?";":",";
 let rows:string[][]=[],row:string[]=[],cell="",quoted=false;
 for(let i=0;i<data.length;i++){
  const c=data[i];
  if(c==='"'&&quoted&&data[i+1]==='"'){cell+='"';i++;}
  else if(c==='"')quoted=!quoted;
  else if(c===delimiter&&!quoted){row.push(cell);cell="";}
  else if((c==="\r"||c==="\n")&&!quoted){
   if(c==="\r"&&data[i+1]==="\n")i++;
   row.push(cell);if(row.some(s=>s.trim()))rows.push(row);
   row=[];cell="";
  }else cell+=c;
 }
 if(quoted)throw Error("csv quotes");
 row.push(cell);if(row.some(s=>s.trim()))rows.push(row);
 return rows;
}
export async function importDirectory(form:FormData){
 const db=await requireAdmin();
 const file=form.get("directory_csv");
 if(!(file instanceof File)||file.size<50||file.size>2_000_000)redirect("/portal?error="+encodeURIComponent("Selecteer de voorbereid CSV van maximaal 2 MB."));
 let parsed:string[][];
 try{parsed=parseCsv((await file.text()).replace(/^\ufeff/,""));}catch{redirect("/portal?error=CSV+formaat+ongeldig");}
 if(parsed.length<2||parsed.length>7000)redirect("/portal?error=Verkeerd+aantal+rijen");
 const headers=parsed[0].map(x=>x.trim().toLowerCase());
 function val(row:string[],key:string,limit:number){const i=headers.indexOf(key);return i===-1?"":(row[i]||"").trim().slice(0,limit);}
 let total=0;
 for(let start=1;start<parsed.length;start+=400){
  const chunk=parsed.slice(start,start+400).map((r,offset)=>{
   const source_row=start+offset+1,name=val(r,"naam",160);
   if(!name)return null;
   return {source_row,name,city:val(r,"plaats",120)||null,address:val(r,"adres",250)||null,
    website:val(r,"website",250)||null,source_profile:val(r,"profiel",500)||null,
    source_name:val(r,"bron",120)||null,kbo_number:val(r,"btw",30)||null};
  }).filter((v):v is NonNullable<typeof v>=>Boolean(v));
  if(!chunk.length)continue;
  const {error}=await db.from("portal_directory").upsert(chunk,{onConflict:"source_row"});
  if(error)redirect("/portal?error="+encodeURIComponent("Import onderbroken bij rij "+start+". Je mag hetzelfde bestand veilig opnieuw uploaden."));
  const contacts=parsed.slice(start,start+400).map((r,offset)=>{
   if(!val(r,"naam",160))return null;
   return {source_row:start+offset+1,email:val(r,"email",250)||null,phone:val(r,"telefoon",100)||null};
  }).filter((v):v is NonNullable<typeof v>=>Boolean(v));
  const {error:contactError}=await db.from("portal_directory_contacts").upsert(contacts,{onConflict:"source_row"});
  if(contactError)redirect("/portal?error="+encodeURIComponent("Contactimport onderbroken bij rij "+start+". Opnieuw uploaden is veilig."));
  total+=chunk.length;
 }
 revalidatePath("/portal");
 redirect("/portal?success="+encodeURIComponent(total+" bedrijfsvermeldingen verwerkt. Bedrijven kunnen nu hun naam opzoeken."));
}
export async function claimDirectory(_previous:Result,form:FormData):Promise<Result>{
 const {db,user}=await authenticate();
 if(!user)return {error:"Log eerst in."};
 const source_row=Number(field(form,"source_row",12));
 if(!Number.isInteger(source_row)||source_row<1)return {error:"Kies een bedrijf uit de zoekresultaten."};
 const {data}=await db.from("portal_directory").select("source_row").eq("source_row",source_row).maybeSingle();
 if(!data)return {error:"Bedrijf niet gevonden."};
 const {error}=await db.from("portal_directory_claims").insert({source_row,user_id:user.id,evidence:field(form,"evidence",500)});
 if(error)return {error:"Aanvraag bestaat al of kon niet opgeslagen worden."};
 revalidatePath("/portal");
 return {error:"",message:"Je claim is ontvangen. IKKENAUTO controleert of je bevoegd bent voor deze garage."};
}
export async function reviewClaim(form:FormData){
 const db=await requireAdmin(),id=Number(field(form,"claim_id",14)),status=field(form,"status",20);
 if(!Number.isInteger(id)||!["approved","rejected"].includes(status))redirect("/portal?error=Ongeldige+claim");
 const {error}=await db.from("portal_directory_claims").update({status}).eq("id",id);
 if(error)redirect("/portal?error=Claim+wijzigen+mislukt");
 revalidatePath("/portal");
 redirect("/portal?success=Claim+bijgewerkt");
}
