"use client";
import {useActionState,useState} from "react";
import {queueExternalLink} from "./improvements";

export function AdvertisementLinkImport(){
 const [state,submit,pending]=useActionState(queueExternalLink,{error:""});
 const [url,setUrl]=useState("");
 const source=/autoscout24\./i.test(url)?"AutoScout24":/mobile\.de/i.test(url)?"mobile.de":/2dehands\.be/i.test(url)?"2dehands":"garagewebsite";
 return <section className="dealer-link-import-section">
  <div className="dealer-panel-heading"><div><h2>Advertentielink toevoegen</h2>
    <p>Plak een bestaande advertentie om de link veilig te bewaren en later aan een toegestane importbron te koppelen.</p></div></div>
  <form className="portal-form" action={submit}>
   <label className="dealer-form-field">
    <span>Link naar je eigen advertentie</span>
    <input type="url" name="source_url" value={url} onChange={e=>setUrl(e.target.value)}
      placeholder="https://www.autoscout24.be/..." autoComplete="url" required
      pattern="https://.*" maxLength={1200}/>
    <small>AutoScout24, mobile.de, 2dehands of je eigen garagewebsite. Geen documenten vereist.</small>
   </label>
   <p className="dealer-source-explainer">
    Herkende bron: <strong>{source}</strong>. De link wordt alleen opgeslagen; er volgt nog geen automatische import.
   </p>
   {state.error&&<p role="alert" className="portal-form-error">{state.error}</p>}
   {state.message&&<p role="status" className="portal-form-ok">{state.message}</p>}
   <button className="portal-button portal-button-secondary" disabled={pending||!url.trim()} type="submit">
    {pending?"Link bewaren…":"Advertentielink bewaren"}
   </button>
  </form>
  <p className="dealer-wizard-footnote">Voor een onmiddellijke voorraadimport: gebruik een CSV-export uit je bestaande software. Automatisch ophalen van gegevens of foto&apos;s gebeurt pas na een toegestane API-/feedkoppeling of een afzonderlijk gecontroleerde toestemming van de bron.</p>
 </section>;
}
