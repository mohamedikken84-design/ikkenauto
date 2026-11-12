"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { portalOrigin } from "@/lib/portal-origin";
import { specFieldByKey, normalizeSpecifications, isApplicable } from "@/lib/dealer/vehicle-fields";
import {parseBelgianEnterpriseNumber} from "@/lib/dealer/kbo";

type Result = { error: string; message?:string; vehicleId?:string };
function field(form:FormData,name:string,max=250){return String(form.get(name)??"").trim().slice(0,max);}
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
 const rowNumber=Number(field(form,"directory_row",12));
 let suggestedRow:number|null=null;
 if(Number.isInteger(rowNumber)&&rowNumber>0){
   const {data}=await db.from("portal_directory").select("source_row").eq("source_row",rowNumber).maybeSingle();
   if(data)suggestedRow=rowNumber;
 }
 const {error}=await db.auth.signUp({email,password,options:{
   emailRedirectTo:(await portalOrigin())+"/portal/auth/callback",
   data:suggestedRow?{suggested_directory_row:suggestedRow}:{}
 }});
 if(error)return {error:"Registreren lukt momenteel niet. Controleer je gegevens of probeer later opnieuw."};
 return {error:"",message:"Account aangemaakt. Controleer je mailbox en bevestig je e-mailadres."};
}
export async function dealerChecked(_previous:Result,form:FormData):Promise<Result>{
 const {db,user}=await authenticate();
 if(!user)return {error:"Je moet eerst aanmelden."};
 const name=field(form,"name",140),city=field(form,"city",120);
 const parsedKbo=parseBelgianEnterpriseNumber(field(form,"kbo_number",40));
 if(!parsedKbo.valid)return {error:parsedKbo.error};
 const kbo=parsedKbo.normalized;
 if(name.length<2)return {error:"Vul de juiste bedrijfsnaam in."};
 if(city.length<2)return {error:"Vul je gemeente in."};

 const {error}=await db.from("portal_dealers").insert({owner_id:user.id,name,city,email:user.email||"",kbo_number:kbo||null,
  phone:field(form,"phone",40)||null,postal_code:field(form,"postal_code",12)||null,website:field(form,"website",250)||null});
 if(error)return {error:error.code==="23505"?"Er bestaat al een dealerprofiel met dit ondernemingsnummer of met jouw account. Contacteer IKKENAUTO om de garage veilig te claimen.":"De garage kon niet worden opgeslagen. Controleer je gegevens."};
 const directoryRow=Number(field(form,"directory_row",8));
 if(Number.isInteger(directoryRow)&&directoryRow>0){
  await db.from("portal_directory_claims").insert({source_row:directoryRow,user_id:user.id,evidence:"Gevonden bij dealerregistratie; verificatie vereist."});
 }
 revalidatePath("/portal");
 redirect("/portal?success="+encodeURIComponent("Garageprofiel opgeslagen. Je kunt nu auto's toevoegen."));
}
const allowedVehicleClasses=new Set(["car","commercial","motorhome","truck","motorcycle","other"]);
const vatRegimes=new Set(["btw","marge","particulier","vrijgesteld","op_aanvraag"]);
function numericOrNull(form:FormData,name:string){
 const value=field(form,name,20);
 if(!value)return null;
 const n=Number(value.replace(",","."));
 return Number.isFinite(n)?n:NaN;
}
function catalogId(form:FormData,name:string){
 const raw=field(form,name,20),id=Number(raw);
 return raw&&Number.isSafeInteger(id)&&id>0?id:null;
}
export async function vehicleChecked(_previous:Result,form:FormData):Promise<Result>{
 let context:Awaited<ReturnType<typeof getDealer>>;
 try{context=await getDealer();}catch{return {error:"Meld je aan en maak eerst je dealerprofiel aan."};}
 const {db,dealerId}=context;
 const make=field(form,"make",70),model=field(form,"model",90);
 const year=numericOrNull(form,"year"),mileage=numericOrNull(form,"mileage_km"),price=numericOrNull(form,"price_eur");
 const seats=numericOrNull(form,"seats"),doors=numericOrNull(form,"doors"),power=numericOrNull(form,"power_hp");
 const powerKw=numericOrNull(form,"power_kw");
 if(!make||!model)return {error:"Merk en model zijn verplicht."};
 if(price===null||!Number.isFinite(price)||price<=0||price>100000000)return {error:"Vul een geldige verkoopprijs in."};
 if(year===null||!Number.isInteger(year)||year<1900||year>new Date().getFullYear()+1)return {error:"Controleer het bouwjaar."};
 if(mileage===null||!Number.isInteger(mileage)||mileage<0||mileage>5000000)return {error:"Controleer de kilometerstand."};
 const optional=(n:number|null,min:number,max:number)=>n===null||(Number.isInteger(n)&&n>=min&&n<=max);
 if(!optional(seats,1,30)||!optional(doors,1,10)||!optional(power,1,3000)||!optional(powerKw,1,2000))return {error:"Controleer de technische velden."};
 const vehicleClass=field(form,"vehicle_class",30)||"car";
 if(!allowedVehicleClasses.has(vehicleClass))return {error:"Ongeldige voertuigcategorie."};
 const fuel=field(form,"fuel",50);
 const sourceFuel=fuel==="Elektrisch"?"electric":fuel==="Plug-in hybride"?"plug_in_hybrid":"other";
 let specs:Record<string,string|number|boolean>={};
 try{
  const json=field(form,"specifications",15000);
  specs=normalizeSpecifications(json?JSON.parse(json):{});
 }catch{return {error:"Technische gegevens zijn beschadigd. Herlaad het formulier en probeer opnieuw."};}
 for(const key of Object.keys(specs)){
  const definition=specFieldByKey.get(key);
  if(!definition||!isApplicable(definition,fuel,vehicleClass))delete specs[key];
 }
 const ids={
  make:catalogId(form,"catalog_make_id"),
  model:catalogId(form,"catalog_model_id"),
  generation:catalogId(form,"catalog_generation_id"),
  powertrain:catalogId(form,"catalog_powertrain_id"),
  trim:catalogId(form,"catalog_trim_id"),
 };
 const submittedCodes=[...new Set(form.getAll("equipment_codes").map(String))]
   .filter(code=>/^[a-z0-9_]{1,90}$/.test(code)).slice(0,240);
 // Catalog relationships and equipment are resolved server-side.
 const [makeResult,modelResult,genResult,powerResult,trimResult,equipmentResult]=await Promise.all([
   ids.make?db.from("portal_vehicle_makes").select("id,name").eq("id",ids.make).maybeSingle():Promise.resolve({data:null}),
   ids.model?db.from("portal_vehicle_models").select("id,name,make_id").eq("id",ids.model).maybeSingle():Promise.resolve({data:null}),
   ids.generation?db.from("portal_vehicle_generations").select("id,code,model_id").eq("id",ids.generation).maybeSingle():Promise.resolve({data:null}),
   ids.powertrain?db.from("portal_vehicle_powertrains").select("id,name,generation_id").eq("id",ids.powertrain).maybeSingle():Promise.resolve({data:null}),
   ids.trim?db.from("portal_vehicle_trims").select("id,name,powertrain_id").eq("id",ids.trim).maybeSingle():Promise.resolve({data:null}),
   submittedCodes.length?db.from("portal_vehicle_equipment_catalog").select("code,label_nl,compatible_fuels")
     .eq("enabled",true).in("code",submittedCodes):Promise.resolve({data:[]}),
 ]);
 const same=(a?:string|null,b?:string|null)=>(a||"").toLocaleLowerCase("nl-BE")===(b||"").toLocaleLowerCase("nl-BE");
 if(ids.make&&(!makeResult.data||!same(makeResult.data.name,make)))return {error:"De gekozen merkvermelding past niet bij de gegevens."};
 if(ids.model&&(!modelResult.data||!same(modelResult.data.name,model)||modelResult.data.make_id!==ids.make))return {error:"Het model past niet bij het merk."};
 if(ids.generation&&(!genResult.data||genResult.data.model_id!==ids.model||!same(genResult.data.code,field(form,"generation_code",60))))return {error:"Deze generatie past niet bij het model."};
 if(ids.powertrain&&(!powerResult.data||powerResult.data.generation_id!==ids.generation||!same(powerResult.data.name,field(form,"motorization",100))))return {error:"Deze motorisatie past niet bij de generatie."};
 if(ids.trim&&(!trimResult.data||trimResult.data.powertrain_id!==ids.powertrain||!same(trimResult.data.name,field(form,"trim_line",150))))return {error:"De uitvoering past niet bij de motorisatie."};
 const catalogEquipment=equipmentResult.data||[];
 if(catalogEquipment.length!==submittedCodes.length)return {error:"Een gekozen uitrustingsoptie bestaat niet meer. Ververs de catalogus."};
 const invalidEquipment=catalogEquipment.some(e=>Array.isArray(e.compatible_fuels)&&e.compatible_fuels.length>0&&!e.compatible_fuels.includes(sourceFuel));
 if(invalidEquipment)return {error:"Verwijder opties die niet bij de gekozen brandstof horen."};
 const vat=field(form,"vat_regime",25)||"op_aanvraag";
 if(!vatRegimes.has(vat))return {error:"Kies een geldig BTW-regime."};
 const warranty=numericOrNull(form,"warranty_months");
 if(!optional(warranty,0,120))return {error:"Garantie moet tussen 0 en 120 maanden liggen."};
 const record={
  dealer_id:dealerId,make,model,
  vehicle_class:vehicleClass,
  catalog_make_id:ids.make,catalog_model_id:ids.model,catalog_generation_id:ids.generation,
  catalog_powertrain_id:ids.powertrain,catalog_trim_id:ids.trim,
  generation_code:field(form,"generation_code",60)||null,
  motorization:field(form,"motorization",100)||null,
  trim_line:field(form,"trim_line",150)||null,
  version:field(form,"version",150)||field(form,"trim_line",150)||null,
  price_eur:price,year,mileage_km:mileage,
  fuel:fuel||null,transmission:field(form,"transmission",50)||null,
  body_type:field(form,"body_type",60)||null,seats,doors,power_hp:power,power_kw:powerKw,
  color:field(form,"color",70)||null,interior_color:field(form,"interior_color",70)||null,
  drivetrain:field(form,"drivetrain",50)||null,condition:field(form,"condition",40)||null,
  emission_class:field(form,"emission_class",30)||null,
  first_registration:field(form,"first_registration",20)||null,vin:field(form,"vin",32)||null,
  description:field(form,"description",4000)||null,
  source_ref:field(form,"source_ref",150)||null,
  vat_regime:vat,vat_deductible:vat==="btw",
  condition_notes:field(form,"condition_notes",2000)||null,
  maintenance_history:field(form,"maintenance_history",2000)||null,
  accident_history:field(form,"accident_history",2000)||null,
  warranty_months:warranty,
  specifications:specs,
  equipment_codes:submittedCodes,
  options:catalogEquipment.map(e=>e.label_nl),
 };
 const {data:created,error}=await db.from("portal_vehicles").insert(record).select("id").single();
 if(error||!created)return {error:"Auto niet opgeslagen. Controleer onder andere of het stocknummer al bestaat."};
 revalidatePath("/portal");
 return {error:"",message:"Concept aangemaakt.",vehicleId:String(created.id)};
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
 const rows:string[][]=[];let row:string[]=[],cell="",quoted=false;
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

export async function resendConfirmation(_previous:Result,form:FormData):Promise<Result>{
 const email=field(form,"email",200).toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {error:"Vul een geldig e-mailadres in."};
 const db=await createSupabaseServer();
 const {error}=await db.auth.resend({type:"signup",email,options:{emailRedirectTo:(await portalOrigin())+"/portal/auth/callback"}});
 if(error)return {error:"Nieuwe e-mail verzenden mislukt. Probeer het later opnieuw."};
 return {error:"",message:"Als je adres nog bevestigd moet worden, ontvang je een nieuwe bevestigingsmail."};
}
