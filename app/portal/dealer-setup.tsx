"use client";
import {useActionState,useEffect,useState} from "react";
import {dealerChecked} from "./improvements";
import {CompanyLookup} from "./directory-search";
export function DealerSetup(){
 const [form,setForm]=useState({name:"",city:"",postal_code:"",phone:"",website:"",kbo_number:""});
 const [selectedRow,setSelectedRow]=useState<number|null>(null);
 const [find,setFind]=useState(false);
 const [state,action,pending]=useActionState(dealerChecked,{error:""});
 const set=(key:keyof typeof form,value:string)=>setForm(s=>({...s,[key]:value}));
 useEffect(()=>{
  try{
   const raw=sessionStorage.getItem("ikkenauto_selected_company");if(!raw)return;
   const c=JSON.parse(raw) as {source_row?:number;name?:string;city?:string;website?:string};
   if(typeof c.source_row==="number"&&Number.isSafeInteger(c.source_row)&&typeof c.name==="string"&&c.name.trim()){
    const task=setTimeout(()=>{setSelectedRow(c.source_row!);setForm(s=>({...s,name:c.name?.slice(0,140)||s.name,city:c.city?.slice(0,120)||s.city,website:c.website?.slice(0,250)||s.website}));},0);
    return()=>clearTimeout(task);
   }
  }catch{}
 },[]);
 const digits=form.kbo_number.replace(/\D/g,"").slice(0,10);
 const formatted=digits.length?"BE "+digits.slice(0,4)+(digits.length>4?"."+digits.slice(4,7):"")+(digits.length>7?"."+digits.slice(7):""):"";
 return <section className="portal-card portal-setup">
  <span className="portal-overline">GARAGEPROFIEL</span><h2>Je garage registreren</h2>
  <p>Begin met je bedrijfsnaam en gemeente. Overige gegevens vul je later aan.</p>
  <div className="portal-find-compact"><button type="button" aria-expanded={find} onClick={()=>setFind(!find)}>{find?"Zoekfunctie sluiten":"Staat je garage al bij IKKENAUTO? Zoek je bedrijf"}</button>
   {find&&<CompanyLookup title="Zoek op bedrijfsnaam" onSelect={c=>{setSelectedRow(c.source_row);setForm(s=>({...s,name:c.name,city:c.city||s.city,website:c.website||s.website}));}}/>}
  </div>
  <form action={action} className="portal-form portal-fields">
   <input type="hidden" name="directory_row" value={selectedRow??""}/>
   <label>Bedrijfsnaam *<input name="name" required autoComplete="organization" value={form.name} onChange={e=>set("name",e.target.value)}/></label>
   <label>Gemeente *<input name="city" required autoComplete="address-level2" value={form.city} onChange={e=>set("city",e.target.value)}/></label>
   <details className="portal-extra portal-full"><summary>Extra bedrijfsgegevens (optioneel)</summary><div className="portal-fields portal-inner-fields">
    <label>Ondernemingsnummer<input name="kbo_number" value={formatted} onChange={e=>set("kbo_number",e.target.value.replace(/\D/g,"").slice(0,10))} inputMode="numeric" placeholder="BE 0123.456.789"/></label>
    <label>Postcode<input name="postal_code" autoComplete="postal-code" value={form.postal_code} onChange={e=>set("postal_code",e.target.value)}/></label>
    <label>Telefoon<input name="phone" type="tel" value={form.phone} onChange={e=>set("phone",e.target.value)}/></label>
    <label>Website<input name="website" type="url" value={form.website} onChange={e=>set("website",e.target.value)} placeholder="https://"/></label>
   </div></details>
   {state.error&&<p role="alert" className="portal-form-error portal-full">{state.error} De ingevulde gegevens blijven bewaard.</p>}
   <button className="portal-button portal-full" disabled={pending}>{pending?"Opslaan…":"Garageprofiel opslaan"}</button>
  </form>
  <p className="portal-note">Een bestaande vermelding wordt pas na controle door IKKENAUTO geverifieerd.</p>
 </section>;
}