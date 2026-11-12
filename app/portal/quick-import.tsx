"use client";
import {useState} from "react";
import Link from "next/link";
import {importDealerCsv} from "./import-stock";
type Preview={headers:string[];rows:string[][];total:number;missing:string[];duplicates:number;hasReferences:boolean};
const aliases:{[name:string]:string[]}={
 Merk:["merk","make","marque","marke","brand","manufacturer"],
 Model:["model","modele","modell"],
 Prijs:["prijs","verkoopprijs","price","priceeur","preis","prix","salesprice","askingprice"]
};
const normalize=(s:string)=>s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
function parseCSV(input:string):string[][]{
 const raw=input.replace(/^\ufeff/,"");
 const first=raw.split(/\r?\n/,1)[0]||"";
 const sep=first.includes(";")?";":first.includes("\t")?"\t":",";
 const rows:string[][]=[];let row:string[]=[],cell="",quoted=false;
 for(let i=0;i<raw.length;i++){
  const c=raw[i];if(c==='"'&&quoted&&raw[i+1]==='"'){cell+='"';i++;}
  else if(c==='"')quoted=!quoted;else if(c===sep&&!quoted){row.push(cell);cell="";}
  else if((c==="\r"||c==="\n")&&!quoted){if(c==="\r"&&raw[i+1]==="\n")i++;row.push(cell);if(row.some(s=>s.trim()))rows.push(row);row=[];cell="";}
  else cell+=c;
 }
 if(quoted)throw Error("Ongeldige aanhalingstekens");
 row.push(cell);if(row.some(s=>s.trim()))rows.push(row);return rows;
}
function inspect(rows:string[][]):Preview{
 const headers=(rows[0]||[]).map(v=>v.trim());
 const canon=headers.map(normalize);
 const missing=Object.entries(aliases).filter(([_, names])=>!canon.some(h=>names.map(normalize).includes(h))).map(([name])=>name);
 const refAliases=["stocknummer","stocknumber","stockid","stockno","sourceref","reference","referentie","internalid","vehicleid"];
 const idx=canon.findIndex(v=>refAliases.includes(v));
 const refs=rows.slice(1).map(row=>idx>=0?String(row[idx]||"").trim():"").filter(Boolean);
 return {headers,rows:rows.slice(1,6),total:Math.max(0,rows.length-1),missing,duplicates:refs.length-new Set(refs).size,hasReferences:idx>=0};
}
export function QuickImport(){
 const [file,setFile]=useState<File|null>(null);
 const [preview,setPreview]=useState<Preview|null>(null);
 const [error,setError]=useState("");
 const [confirmed,setConfirmed]=useState(false);
 const [busy,setBusy]=useState(false);
 const choose=async(e:React.ChangeEvent<HTMLInputElement>)=>{
  const f=e.target.files?.[0]||null;setFile(f);setConfirmed(false);setPreview(null);setError("");
  if(!f)return;
  if(f.size>3_000_000){setError("Het bestand mag maximaal 3 MB groot zijn.");return;}
  setBusy(true);
  try{const rows=parseCSV(await f.text());if(rows.length<2||rows.length>1501)throw Error("CSV moet 1 tot 1.500 voertuigen bevatten.");setPreview(inspect(rows));}
  catch(ex){setError(ex instanceof Error?ex.message:"Kon het bestand niet lezen.");}
  finally{setBusy(false);}
 };
 const valid=Boolean(preview&&!preview.missing.length&&!preview.duplicates);
 return <section className="portal-card portal-import-wizard">
   <span className="portal-overline">VOORRAADBEHEER</span><h2>Voertuigen importeren</h2>
   <p>Gebruik een CSV-export van uw voorraadprogramma. We controleren eerst de kolommen en tonen een voorbeeld. Uw huidige voorraad wordt niet automatisch verwijderd.</p>
   <form action={importDealerCsv} className="portal-form">
    <div className="portal-import-upload"><label>CSV-bestand selecteren<input type="file" name="csv" accept=".csv,text/csv" onChange={choose} required/></label><Link href="/portal/api/csv-template" className="portal-text-link">Voorbeeldbestand downloaden</Link></div>
    {busy&&<p className="portal-note">Bestand controleren…</p>}
    {error&&<p role="alert" className="portal-form-error">{error}</p>}
    {preview&&<div className="portal-import-review">
      <div className="portal-import-review-top"><strong>Voorbeeld van de import</strong><span>{preview.total} voertuigen in bestand</span></div>
      {preview.missing.length>0&&<p className="portal-form-error">Verplichte kolommen niet gevonden: {preview.missing.join(", ")}. Bekijk het voorbeeldbestand en pas de kolomkoppen aan.</p>}
      {preview.duplicates>0&&<p className="portal-form-error">{preview.duplicates} dubbele stocknummers in het bestand. Controleer deze eerst.</p>}
      {!preview.hasReferences&&<p className="portal-import-warning">Geen stocknummer gevonden. Importeert u dit bestand later opnieuw, dan kunnen dubbele voertuigen ontstaan.</p>}
      <div className="portal-table-wrap"><table className="portal-table"><thead><tr>{preview.headers.slice(0,8).map((x,i)=><th key={i}>{x||"Kolom "+(i+1)}</th>)}</tr></thead><tbody>{preview.rows.map((row,i)=><tr key={i}>{preview.headers.slice(0,8).map((_,j)=><td key={j}>{row[j]||"—"}</td>)}</tr>)}</tbody></table></div>
      {valid&&<label className="portal-import-confirm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>Ik heb de voorbeeldgegevens gecontroleerd. Bestaande stocknummers kunnen worden bijgewerkt.</label>}
    </div>}
    <button type="submit" className="portal-primary" disabled={!valid||!confirmed||busy||!file}>Import bevestigen</button>
   </form>
   <p className="portal-note">Advertentielinks van AutoScout24 en 2dehands worden niet automatisch gekopieerd. Hiervoor is een toegestane export of technische koppeling nodig.</p>
 </section>;
}
