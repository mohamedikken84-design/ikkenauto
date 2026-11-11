"use server";
import {createSupabaseServer} from "@/lib/supabase/server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
const err=(msg:string):never=>redirect("/portal?error="+encodeURIComponent(msg));
function parseCSV(raw:string){
 const text=raw.replace(/^\ufeff/,""),first=text.split(/\r?\n/,1)[0];
 const d=first.includes(";")?";":first.includes("\t")?"\t":",";
 const rows:string[][]=[];let row:string[]=[],cell="",quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;}
  else if(c==='"')quoted=!quoted;
  else if(c===d&&!quoted){row.push(cell);cell="";}
  else if((c==="\n"||c==="\r")&&!quoted){
   if(c==="\r"&&text[i+1]==="\n")i++;
   row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
   cell="";row=[];
  }else cell+=c;
 }
 if(quoted)throw Error("broken");
 row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
 return rows;
}
const norm=(v:string)=>v.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
const names:Record<string,string[]>={
 make:["merk","marque","make","marke","brand","manufacturer"],
 model:["model","modele","modell"],
 price:["prijs","verkoopprijs","price","priceeur","preis","prix","salesprice","askingprice"],
 year:["bouwjaar","year","jahr","annee","firstregistration","registrationyear","erstzulassung"],
 mileage:["kilometerstand","kilometers","km","mileage","laufleistung","kilometrage"],
 ref:["stocknummer","stocknumber","stockid","stockno","source_ref","reference","referentie","internalid","vehicleid"],
 fuel:["brandstof","fuel","carburant","kraftstoff"],
 transmission:["transmissie","transmission","gearbox","getriebe","boite"],
 version:["versie","version","variant","uitvoering"],
 body:["carrosserie","bodytype","body","karosserie"],
 color:["kleur","color","farbe","couleur"],
 seats:["zitplaatsen","seats","places","sitzplatze"],
 doors:["deuren","doors","portes","turen"],
 power:["pk","powerhp","puissancech","leistungps"]
};
function priceValue(text:string){
 let v=text.replace(/[^\d.,-]/g,"");
 if(v.includes(",")&&v.includes("."))v=v.lastIndexOf(",")>v.lastIndexOf(".")?v.replace(/\./g,"").replace(",","."):v.replace(/,/g,"");
 else if(v.includes(","))v=/,\d{3}$/.test(v)?v.replace(/,/g,""):v.replace(",",".");
 else if(/\.\d{3}$/.test(v))v=v.replace(".","");
 return Number(v);
}
export async function importDealerCsv(form:FormData){
 const db=await createSupabaseServer();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return err("Je bent niet ingelogd.");
 const {data:dealer}=await db.from("portal_dealers").select("id").eq("owner_id",user.id).maybeSingle();
 if(!dealer)return err("Maak eerst je garageprofiel aan.");
 const file=form.get("csv");
 if(!(file instanceof File)||!file.size||file.size>3_000_000)return err("Kies een CSV-bestand tot 3 MB.");
 let rows:string[][]=[];
 try{rows=parseCSV(await (file as File).text());}catch{return err("CSV kan niet worden gelezen.");}
 if(rows.length<2||rows.length>1501)err("Het CSV-bestand moet 1 tot 1.500 auto's bevatten.");
 const headings=rows[0].map(norm);
 const ix=(name:string)=>headings.findIndex(h=>names[name].map(norm).includes(h));
 if(["make","model","price"].some(key=>ix(key)<0))return err("CSV mist merk, model of prijs. Download ons voorbeeldbestand.");
 const col=(r:string[],name:string)=>{const i=ix(name);return i>=0?(r[i]||"").trim():"";};
 let errors=0;const references=new Map<string,Record<string,unknown>>(),without:Record<string,unknown>[]=[];
 for(const row of rows.slice(1)){
  const make=col(row,"make").slice(0,70),model=col(row,"model").slice(0,90);
  const priceText=col(row,"price"),price=priceValue(priceText);
  const yearText=col(row,"year"),match=yearText.match(/(?:19|20)\d{2}/),year=match?Number(match[0]):null;
  const kmText=col(row,"mileage"),km=kmText?Number(kmText.replace(/[^\d]/g,"")):null;
  if(!make||!model||!priceText||!Number.isFinite(price)||price<=0||price>=100000000||
      (year!==null&&(year<1900||year>2100))||(km!==null&&km>5000000)){errors++;continue;}
  const ref=col(row,"ref").slice(0,150);
  const n=(k:string,max:number)=>{const num=Number(col(row,k).replace(/[^\d]/g,""));return Number.isInteger(num)&&num>=1&&num<=max?num:null;};
  const vehicle={dealer_id:dealer.id,make,model,price_eur:price,year,mileage_km:km,source_ref:ref||null,
   fuel:col(row,"fuel").slice(0,50)||null,transmission:col(row,"transmission").slice(0,50)||null,
   version:col(row,"version").slice(0,150)||null,body_type:col(row,"body").slice(0,60)||null,
   color:col(row,"color").slice(0,70)||null,seats:n("seats",30),doors:n("doors",10),power_hp:n("power",3000)};
  if(ref)references.set(ref,vehicle);else without.push(vehicle);
 }
 let saved=0;
 for(const [items,update] of [[...references.values(),true],[without,false]] as [Record<string,unknown>[],boolean][]){
  for(let i=0;i<items.length;i+=100){
   const batch=items.slice(i,i+100);
   const res=update?await db.from("portal_vehicles").upsert(batch,{onConflict:"dealer_id,source_ref"}):await db.from("portal_vehicles").insert(batch);
   if(res.error)err(saved+" auto's verwerkt, maar de import is gestopt. Controleer de kolommen.");
   saved+=batch.length;
  }
 }
 revalidatePath("/portal");
 redirect("/portal?success="+encodeURIComponent(saved+" auto's geïmporteerd, "+errors+" rijen overgeslagen. Zonder stocknummer kan een herhaalde import duplicaten opleveren."));
}