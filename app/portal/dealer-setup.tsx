"use client";
import {useActionState,useState} from "react";
import {dealerChecked} from "./improvements";
import {CompanyLookup} from "./directory-search";
export function DealerSetup({suggestedCompany}:{suggestedCompany?:{source_row:number;name:string;city:string|null;website:string|null}|null}){
 const [form,setForm]=useState({name:suggestedCompany?.name??"",city:suggestedCompany?.city??"",postal_code:"",phone:"",website:suggestedCompany?.website??"",kbo_number:""});
 const [selectedRow,setSelectedRow]=useState<number|null>(suggestedCompany?.source_row??null);
 const [state,action,pending]=useActionState(dealerChecked,{error:""});
 function set(name:keyof typeof form,value:string){setForm(s=>({...s,[name]:value}));if(name==="name"||name==="city")setSelectedRow(null);}
 const numbers=form.kbo_number.replace(/\D/g,"").slice(0,10);
 const formatted=numbers.length?("BE "+numbers.slice(0,4)+(numbers.length>4?"."+numbers.slice(4,7):"")+(numbers.length>7?"."+numbers.slice(7):"")):"";
 return <section className="portal-card portal-setup"><span className="portal-overline">GARAGE REGISTREREN</span><h2>Vind of voeg je garage toe</h2>
  <p>Vul eerst de basisgegevens in. De overige gegevens kun je later aanvullen.</p>
  <details className="dealer-company-details"><summary>Staat jouw garage al bij IKKENAUTO? Zoek je bedrijf.</summary><CompanyLookup title="Bedrijfsnaam" onSelect={c=>{setSelectedRow(c.source_row);setForm(s=>({...s,name:c.name,city:c.city||s.city,website:c.website||s.website}));}}/></details>
  {selectedRow&&<p className="portal-note">Vermelding geselecteerd. IKKENAUTO controleert je claim voordat die wordt goedgekeurd.</p>}
  <form action={action} className="portal-form portal-fields">
   <input type="hidden" name="directory_row" value={selectedRow||""}/>
   <label>Bedrijfsnaam *<input name="name" value={form.name} onChange={e=>set("name",e.target.value)} required/></label>
   <label>Gemeente *<input name="city" value={form.city} onChange={e=>set("city",e.target.value)} required/></label>
   <label>Ondernemingsnummer (optioneel)<input name="kbo_number" value={formatted} onChange={e=>set("kbo_number",e.target.value.replace(/\D/g,"").slice(0,10))} inputMode="numeric" placeholder="BE 0123.456.789"/><small>Wij zetten de cijfers automatisch in het juiste formaat en controleren het nummer.</small></label>
   <label>Postcode<input name="postal_code" value={form.postal_code} onChange={e=>set("postal_code",e.target.value)}/></label>
   <label>Telefoon<input name="phone" type="tel" value={form.phone} onChange={e=>set("phone",e.target.value)}/></label>
   <label>Website<input name="website" type="url" placeholder="https://..." value={form.website} onChange={e=>set("website",e.target.value)}/></label>
   {state.error&&<p className="portal-form-error portal-full" role="alert">{state.error} Je gegevens blijven ingevuld.</p>}
   <button disabled={pending} className="portal-button portal-full">{pending?"Opslaan…":"Garageprofiel opslaan"}</button>
  </form>
 </section>;
}