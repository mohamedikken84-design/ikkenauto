"use client";
import {useState} from "react";
import {importDealerCsv} from "./import-stock";
type Preview={valid:boolean;headers:string[];samples:string[][];count:number;duplicates:number;hasRefs:boolean;message:string};
function parseCsv(text:string){
 const clean=text.replace(/^\ufeff/,""),head=clean.split(/\r?\n/,1)[0]||"";
 const delimiter=head.includes(";")?";":head.includes("\t")?"\t":",";
 const rows:string[][]=[];let row:string[]=[],cell="",quoted=false;
 for(let i=0;i<clean.length;i++){
  const ch=clean[i];
  if(ch==='"'&&quoted&&clean[i+1]==='"'){cell+='"';i++;}
  else if(ch==='"')quoted=!quoted;
  else if(ch===delimiter&&!quoted){row.push(cell);cell="";}
  else if((ch==="\r"||ch==="\n")&&!quoted){
   if(ch==="\r"&&clean[i+1]==="\n")i++;
   row.push(cell);if(row.some(value=>value.trim()))rows.push(row);
   row=[];cell="";
  }else cell+=ch;
 }
 if(quoted)throw Error("Ongesloten aanhalingsteken");
 row.push(cell);if(row.some(value=>value.trim()))rows.push(row);
 return rows;
}
const normalize=(value:string)=>value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
const required:Record<string,string[]>={
 merk:["merk","marque","make","marke","brand","manufacturer"],
 model:["model","modele","modell"],
 prijs:["prijs","verkoopprijs","price","priceeur","preis","prix","salesprice","askingprice"]
};
const refs=["stocknummer","stocknumber","stockid","stockno","sourceref","reference","referentie","internalid","vehicleid"];
export function QuickImport(){
 const [preview,setPreview]=useState<Preview|null>(null);
 const [reading,setReading]=useState(false);
 async function readFile(file?:File){
  setPreview(null);
  if(!file)return;
  if(file.size>3_000_000){setPreview({valid:false,headers:[],samples:[],count:0,duplicates:0,hasRefs:false,message:"Maximale bestandsgrootte: 3 MB."});return;}
  setReading(true);
  try{
   const rows=parseCsv(await file.text());
   const headers=rows[0]?.map(x=>x.trim())||[], normalized=headers.map(normalize);
   const missing=Object.entries(required).filter(([,values])=>!values.some(x=>normalized.includes(normalize(x)))).map(([name])=>name);
   const index=normalized.findIndex(x=>refs.includes(x));
   const numbers=new Set<string>();let duplicates=0;
   if(index>=0)for(const row of rows.slice(1)){const id=(row[index]||"").trim();if(id){if(numbers.has(id))duplicates++;numbers.add(id);}}
   const count=Math.max(0,rows.length-1);
   const valid=count>0&&count<=1500&&missing.length===0;
   const message=missing.length?"Ontbrekende kolommen: "+missing.join(", ")+".":count===0?"Er zijn geen voertuigen gevonden.":count>1500?"Maximaal 1.500 voertuigen per bestand.":"Controleer de kolommen en voorbeeldrijen voor je importeert.";
   setPreview({valid,headers,samples:rows.slice(1,4),count,duplicates,hasRefs:index>=0,message});
  }catch{setPreview({valid:false,headers:[],samples:[],count:0,duplicates:0,hasRefs:false,message:"Het CSV-bestand kan niet worden gelezen. Controleer het formaat."});}
  finally{setReading(false);}
 }
 return <details className="dealer-import-disclosure">
  <summary>CSV-import</summary>
  <div className="dealer-import-content">
   <p className="portal-note">Voor een exportbestand met meerdere auto's. Eén voertuig voeg je via ‘Auto toevoegen’ in.</p>
   <form action={importDealerCsv} className="portal-form">
    <label>CSV-bestand selecteren
     <input type="file" name="csv" accept=".csv,text/csv" required onChange={event=>void readFile(event.target.files?.[0])}/>
    </label>
    <p className="portal-note"><a className="portal-text-link" href="/portal/api/csv-template">Download een voorbeeldbestand</a>. Veelgebruikte Nederlandse, Franse, Engelse en Duitse kolomnamen worden herkend.</p>
    {reading&&<p className="portal-note" role="status">Bestand controleren…</p>}
    {preview&&<div className="dealer-csv-preview">
      <h3>Voorbeeld vóór import</h3>
      <p className={preview.valid?"dealer-csv-valid":"portal-form-error"}>{preview.message}</p>
      {preview.count>0&&<p className="portal-note">{preview.count} rijen gevonden{preview.duplicates?", "+preview.duplicates+" herhaalde stocknummers":""}. {preview.hasRefs?"Stocknummers worden bij bestaande auto's bijgewerkt.":"Geen stocknummer herkend: een herhaalde import kan dubbelen opleveren."}</p>}
      {preview.headers.length>0&&<div className="portal-table-wrap"><table className="portal-table"><thead><tr>{preview.headers.slice(0,7).map((h,i)=><th key={i}>{h||"Kolom "+(i+1)}</th>)}</tr></thead><tbody>{preview.samples.map((row,i)=><tr key={i}>{row.slice(0,7).map((val,j)=><td key={j}>{val.slice(0,90)}</td>)}</tr>)}</tbody></table></div>}
    </div>}
    <button type="submit" disabled={!preview?.valid||reading} className="portal-button portal-button-secondary">Import bevestigen</button>
   </form>
   <p className="portal-note">Directe synchronisatie via AutoScout24 of 2dehands is nog niet beschikbaar. Een advertentielink wordt niet als voltooide import voorgesteld.</p>
  </div>
 </details>;
}
