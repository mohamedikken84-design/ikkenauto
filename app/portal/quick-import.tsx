"use client";
import {useState} from "react";
import {importDealerCsv} from "./import-stock";
type Preview={headers:string[];rows:string[][];total:number;hasRequired:boolean;duplicateReferences:number};
const normalized=(v:string)=>v.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
function csvRows(raw:string){
 const input=raw.replace(/^\ufeff/,""),header=input.split(/\r?\n/,1)[0],separator=header.includes(";")?";":header.includes("\t")?"\t":",";
 const rows:string[][]=[];let cell="",row:string[]=[],quotes=false;
 for(let i=0;i<input.length;i++){const c=input[i];
  if(c==='"'&&quotes&&input[i+1]==='"'){cell+='"';i++;}
  else if(c==='"')quotes=!quotes;
  else if(c===separator&&!quotes){row.push(cell);cell="";}
  else if((c==="\r"||c==="\n")&&!quotes){
   if(c==="\r"&&input[i+1]==="\n")i++;
   row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell="";
  }else cell+=c;
 }
 if(quotes)throw Error("Niet-afgesloten tekstveld in CSV.");
 row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 return rows;
}
const aliases={
 make:["merk","marque","make","marke","brand","manufacturer"],
 model:["model","modele","modell"],
 price:["prijs","verkoopprijs","price","priceeur","preis","prix","salesprice","askingprice"]
};
export function QuickImport(){
 const [open,setOpen]=useState(false),[preview,setPreview]=useState<Preview|null>(null);
 const [error,setError]=useState(""),[confirmed,setConfirmed]=useState(false),[key,setKey]=useState(0);
 async function inspect(file:File|undefined){
  setPreview(null);setError("");setConfirmed(false);
  if(!file)return;
  if(file.size>3000000){setError("Dit CSV-bestand is groter dan 3 MB.");return;}
  try{
   const rows=csvRows(await file.text());
   if(rows.length<2||rows.length>1501){setError("Gebruik een CSV met 1 tot 1.500 voertuigen.");return;}
   const normalizedHeaders=rows[0].map(normalized);
   const required=Object.values(aliases).every(list=>list.some(v=>normalizedHeaders.includes(normalized(v))));
   const referenceColumn=normalizedHeaders.findIndex(h=>["stocknummer","stocknumber","stockid","stockno","sourceref","reference","referentie","internalid","vehicleid"].includes(h));
   const references=referenceColumn<0?[]:rows.slice(1).map(row=>(row[referenceColumn]||"").trim()).filter(Boolean);
   setPreview({headers:rows[0],rows:rows.slice(1,6),total:rows.length-1,hasRequired:required,duplicateReferences:references.length-new Set(references).size});
   if(!required)setError("De kolommen merk, model en prijs ontbreken of worden niet herkend. Download het voorbeeldbestand en vergelijk de koppen.");
  }catch{setError("Het bestand bevat een onjuist CSV-formaat.");}
 }
 return <section className="portal-card portal-import-compact">
  <div className="portal-card-heading"><div><span className="portal-overline">OPTIONEEL</span><h2>Meerdere auto&apos;s importeren</h2></div></div>
  <p>Heb je al een CSV-export van je voorraad? Controleer de gegevens vóór de import.</p>
  <button className="portal-import-toggle" type="button" aria-expanded={open} onClick={()=>setOpen(s=>!s)}>{open?"Import sluiten":"CSV-bestand importeren"}</button>
  {open&&<form action={importDealerCsv} className="portal-form portal-subform" key={key}>
   <label>Voorraadbestand (.csv)<input type="file" name="csv" accept=".csv,text/csv" required onChange={e=>inspect(e.target.files?.[0])}/></label>
   <a href="/portal/api/csv-template" className="portal-text-link">Download CSV-voorbeeld</a>
   {preview&&<div className="portal-csv-preview">
    <p><strong>{preview.total} voertuigen gevonden.</strong> {preview.duplicateReferences>0?preview.duplicateReferences+" dubbele stocknummers in het bestand.":""}</p>
    <div className="portal-table-wrap"><table className="portal-table"><thead><tr>{preview.headers.slice(0,6).map((h,i)=><th key={i}>{h||"Kolom "+(i+1)}</th>)}</tr></thead><tbody>{preview.rows.map((row,i)=><tr key={i}>{row.slice(0,6).map((value,j)=><td key={j}>{value||"—"}</td>)}</tr>)}</tbody></table></div>
    <p className="portal-note">Voorbeeld van maximaal vijf rijen. Bestaande voorraad met hetzelfde stocknummer wordt bijgewerkt; zonder stocknummer kan een herhaalde import dubbels veroorzaken. Bij de import worden ongeldige rijen overgeslagen.</p>
    <label className="portal-checkline"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> Ik heb de gegevens en prijzen gecontroleerd.</label>
   </div>}
   {error&&<p className="portal-form-error" role="alert">{error}</p>}
   <button className="portal-button portal-button-secondary" disabled={!preview?.hasRequired||!confirmed||Boolean(error)}>Import bevestigen</button>
   <button className="portal-import-reset" type="button" onClick={()=>{setKey(x=>x+1);setPreview(null);setError("");setConfirmed(false);}}>Ander bestand kiezen</button>
  </form>}
  <p className="portal-note">Automatisch overnemen via advertentielinks wordt nog niet ondersteund. We tonen deze optie pas wanneer een betrouwbare, toegestane koppeling beschikbaar is.</p>
 </section>;
}