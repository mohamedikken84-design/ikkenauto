"use client";
import {useActionState,useState} from "react";
import {queueExternalLink} from "./improvements";
import {importVehicles} from "./actions";
export function QuickImport(){
 const [open,setOpen]=useState<"csv"|"link"|null>(null);
 const [url,setUrl]=useState("");
 const [state,action,pending]=useActionState(queueExternalLink,{error:""});
 return <section className="portal-card"><div className="portal-card-heading"><div><span className="portal-overline">SNEL IMPORTEREN</span><h2>Auto's overnemen</h2></div></div>
  <p>Heb je je voorraad al ergens anders? Gebruik een CSV-export of bewaar de link naar je advertentie.</p>
  <div className="portal-import-buttons"><button type="button" onClick={()=>setOpen(open==="csv"?null:"csv")}>↑ CSV importeren</button><button type="button" onClick={()=>setOpen(open==="link"?null:"link")}>🔗 Link toevoegen</button></div>
  {open==="csv"&&<form className="portal-form portal-subform" action={importVehicles}><label>CSV-bestand<input type="file" name="csv" accept=".csv,text/csv" required/></label><p className="portal-note">Ondersteunde kolommen: merk, model, prijs, bouwjaar, kilometerstand, stocknummer. Exports verschillen per platform; controleer de kolomnamen.</p><button className="portal-button portal-button-secondary">Import starten</button></form>}
  {open==="link"&&<form className="portal-form portal-subform" action={action}><label>Advertentielink<input name="source_url" type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://www.autoscout24.be/..." required/></label>
   <p className="portal-note">Voor AutoScout24 en 2dehands. We bewaren de link voor importcontrole; gegevens worden niet automatisch van een externe website gekopieerd.</p>
   {state.error&&<p className="portal-form-error">{state.error}</p>}{state.message&&<p className="portal-form-ok">{state.message}</p>}
   <button className="portal-button portal-button-secondary" disabled={pending}>Link bewaren</button></form>}
 </section>;
}