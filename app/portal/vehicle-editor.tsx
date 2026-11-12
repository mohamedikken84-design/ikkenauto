"use client";
import {useActionState,useState} from "react";
import {vehicleChecked} from "./improvements";
import {vehicleMakes,suggestedModels} from "@/lib/dealer/vehicle-catalog";
const equipment=["Airconditioning","Automatische klimaatregeling","Cruisecontrol","Adaptieve cruisecontrol","Navigatie","Apple CarPlay","Android Auto","Achteruitrijcamera","Parkeersensoren voor","Parkeersensoren achter","Ledkoplampen","Matrix-led","Panoramadak","Trekhaak","Verwarmde zetels","Elektrische zetels","Lederen bekleding","Isofix","Dodehoekwaarschuwing","Rijstrookassistent","Keyless entry","Elektrische achterklep","Bluetooth","Head-updisplay","360° camera","Sportpakket","Lichtmetalen velgen"];
export function VehicleEditor(){
 const [state,action,pending]=useActionState(vehicleChecked,{error:""});
 const [form,setForm]=useState<Record<string,string>>({});
 const update=(k:string,v:string)=>setForm(prev=>({...prev,[k]:v}));
 const input=(k:string,placeholder="",type="text",required=false)=><input name={k} type={type} placeholder={placeholder} required={required} value={form[k]||""} onChange={e=>update(k,e.target.value)}/>;
 const select=(k:string,options:string[])=><select name={k} value={form[k]||""} onChange={e=>update(k,e.target.value)}><option value="">Kies…</option>{options.map(x=><option key={x} value={x}>{x}</option>)}</select>;
 return <section className="portal-card"><div className="portal-card-heading"><div><span className="portal-overline">VOORRAAD</span><h2>Auto toevoegen</h2></div></div>
  <p>Vul de basisgegevens in. Extra kenmerken zijn optioneel en helpen straks met zoeken en filteren.</p>
  <form className="portal-form portal-fields" action={action}>
   <label>Merk *<input name="make" list="portal-makes" required value={form.make||""} onChange={e=>update("make",e.target.value)} placeholder="Kies of typ een merk"/><datalist id="portal-makes">{vehicleMakes.map(m=><option key={m} value={m}/>)}</datalist><small>{vehicleMakes.length} merken als suggestie. Staat jouw merk er niet tussen? Typ het zelf.</small></label>
   <label>Model *<input name="model" value={form.model||""} onChange={e=>update("model",e.target.value)} list="portal-models" placeholder="Bijv. Golf, X5, C-Klasse" required/><datalist id="portal-models">{suggestedModels(form.make).map(m=><option key={m} value={m}/>)}</datalist><small>Model niet in de lijst? Je kunt elk model invoeren.</small></label>
   <label>Uitvoering{input("version","M Sport / AMG Line / Style")}</label><label>Verkoopprijs (€) *{input("price_eur","19990","number",true)}</label>
   <label>Bouwjaar *{input("year","2022","number",true)}</label><label>Kilometerstand *{input("mileage_km","58000","number",true)}</label>
   <label>Brandstof{select("fuel",["Benzine","Diesel","Elektrisch","Hybride","Plug-in hybride","LPG","CNG","Waterstof","Overig"])}</label>
   <label>Versnellingsbak{select("transmission",["Automaat","Manueel","Semi-automaat"])}</label>
   <details className="portal-extra portal-full"><summary>Meer voertuiggegevens invullen</summary>
    <div className="portal-fields portal-inner-fields">
     <label>Carrosserie{select("body_type",["SUV","Berline","Hatchback","Break","Coupé","Cabrio","Monovolume","Bestelwagen","Pick-up","Andere"])}</label>
     <label>Staat{select("condition",["Nieuw","Tweedehands","Demowagen","Oldtimer","Schadevoertuig"])}</label>
     <label>Zitplaatsen{select("seats",Array.from({length:10},(_,i)=>String(i+1)))}</label>
     <label>Deuren{select("doors",["2","3","4","5","6"])}</label>
     <label>Vermogen (pk){input("power_hp","150","number")}</label>
     <label>Emissieklasse{select("emission_class",["Euro 6e","Euro 6d","Euro 6","Euro 5","Euro 4","Euro 3","Elektrisch / n.v.t."])}</label>
     <label>Exterieurkleur{select("color",["Zwart","Wit","Grijs","Zilver","Blauw","Rood","Groen","Bruin","Beige","Goud","Andere"])}</label>
     <label>Interieurkleur{select("interior_color",["Zwart","Grijs","Beige","Bruin","Andere"])}</label>
     <label>Aandrijving{select("drivetrain",["Voorwielaandrijving","Achterwielaandrijving","Vierwielaandrijving"])}</label>
     <label>Eerste inschrijving{input("first_registration","MM/JJJJ")}</label>
     <label>VIN (optioneel){input("vin","17 tekens")}</label>
     <label>Eigen stocknummer{input("source_ref","GARAGE-001")}</label>
     <label className="portal-full portal-checkline"><input type="checkbox" name="vat_deductible"/> BTW aftrekbaar</label>
    </div>
    <h3>Opties & uitrusting</h3><div className="portal-options">{equipment.map(e=><label key={e}><input type="checkbox" name="options" value={e}/>{e}</label>)}</div>
    <label className="portal-full">Omschrijving<textarea name="description" rows={4} value={form.description||""} onChange={e=>update("description",e.target.value)} placeholder="Extra informatie over de auto…"/></label>
   </details>
   {state.error&&<p className="portal-form-error portal-full" role="alert">{state.error} De ingevulde velden blijven bewaard.</p>}
   <button className="portal-button portal-full" disabled={pending}>{pending?"Auto opslaan…":"Auto aan voorraad toevoegen"}</button>
  </form>
 </section>;
}