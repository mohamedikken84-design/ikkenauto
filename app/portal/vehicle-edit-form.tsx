"use client";
import { useActionState, useState } from "react";
import { updateVehicle } from "./vehicle-edit-actions";

type VehicleRecord = {
  id:string;make:string;model:string;version:string|null;price_eur:number;year:number|null;
  mileage_km:number|null;fuel:string|null;transmission:string|null;body_type:string|null;
  color:string|null;emission_class:string|null;condition:string|null;source_ref:string|null;
  seats:number|null;doors:number|null;power_hp:number|null;description:string|null;
  status:string;vat_deductible:boolean;options:string[]|null;
};
const fuelTypes=["Benzine","Diesel","Elektrisch","Hybride","Plug-in hybride","LPG","CNG","Waterstof"];
const gearbox=["Automaat","Manueel","Semi-automaat"];
const types=["SUV","Berline","Hatchback","Break","Coupé","Cabrio","Monovolume","Bestelwagen","Pick-up","Andere"];
const colors=["Zwart","Wit","Grijs","Zilver","Blauw","Rood","Groen","Bruin","Beige","Andere"];
const equipment=["Airconditioning","Automatische klimaatregeling","Cruisecontrol","Adaptieve cruisecontrol","Navigatie","Apple CarPlay","Android Auto","Achteruitrijcamera","Parkeersensoren voor","Parkeersensoren achter","Ledkoplampen","Panoramadak","Trekhaak","Verwarmde zetels","Elektrische zetels","Lederen bekleding","Isofix","Dodehoekwaarschuwing","Rijstrookassistent","Keyless entry","Elektrische achterklep","Bluetooth","Head-updisplay","360° camera","Sportpakket","Lichtmetalen velgen"];
export function VehicleEditForm({vehicle}:{vehicle:VehicleRecord}){
 const [state,action,pending]=useActionState(updateVehicle,{error:""});
 const [values,setValues]=useState<Record<string,string>>({
  make:vehicle.make,model:vehicle.model,version:vehicle.version||"",price_eur:String(vehicle.price_eur),
  year:vehicle.year?String(vehicle.year):"",mileage_km:vehicle.mileage_km===null?"":String(vehicle.mileage_km),
  fuel:vehicle.fuel||"",transmission:vehicle.transmission||"",body_type:vehicle.body_type||"",
  color:vehicle.color||"",emission_class:vehicle.emission_class||"",condition:vehicle.condition||"",
  source_ref:vehicle.source_ref||"",seats:vehicle.seats?String(vehicle.seats):"",
  doors:vehicle.doors?String(vehicle.doors):"",power_hp:vehicle.power_hp?String(vehicle.power_hp):"",
  description:vehicle.description||"",status:vehicle.status
 });
 const [deductible,setDeductible]=useState(Boolean(vehicle.vat_deductible));
 const [selectedOptions,setSelectedOptions]=useState<string[]>(vehicle.options||[]);
 const change=(name:string,v:string)=>setValues(p=>({...p,[name]:v}));
 const input=(name:string,label:string,opts:{type?:string;required?:boolean;placeholder?:string}={})=><label>{label}
   <input name={name} type={opts.type||"text"} required={opts.required} placeholder={opts.placeholder} value={values[name]??""} onChange={e=>change(name,e.target.value)}/>
 </label>;
 const select=(name:string,label:string,options:string[])=><label>{label}<select name={name} value={values[name]||""} onChange={e=>change(name,e.target.value)}>
   <option value="">Niet opgegeven</option>{options.map(x=><option key={x} value={x}>{x}</option>)}
 </select></label>;
 const allOptions=Array.from(new Set([...equipment,...selectedOptions]));
 return <form action={action} className="portal-form portal-fields" id="vehicle-edit-form">
   <input name="vehicle_id" type="hidden" value={vehicle.id}/>
   {input("make","Merk *",{required:true})}{input("model","Model *",{required:true})}
   {input("version","Uitvoering")}
   {input("price_eur","Prijs (€) *",{type:"number",required:true})}
   {input("year","Bouwjaar",{type:"number"})}
   {input("mileage_km","Kilometerstand",{type:"number"})}
   {select("fuel","Brandstof",fuelTypes)}
   {select("transmission","Versnellingsbak",gearbox)}
   {select("body_type","Carrosserie",types)}
   {select("condition","Staat",["Nieuw","Tweedehands","Demowagen","Oldtimer","Schadevoertuig"])}
   {select("color","Kleur",colors)}
   {select("emission_class","Emissieklasse",["Euro 6e","Euro 6d","Euro 6","Euro 5","Euro 4","Euro 3","Elektrisch / n.v.t."])}
   {select("seats","Zitplaatsen",Array.from({length:10},(_,i)=>String(i+1)))}
   {select("doors","Deuren",["2","3","4","5","6"])}
   {input("power_hp","Vermogen (pk)",{type:"number"})}
   {input("source_ref","Stocknummer")}
   <label>Voorraadstatus<select name="status" value={values.status} onChange={e=>change("status",e.target.value)}><option value="draft">Concept</option><option value="ready">Klaar voor lancering</option><option value="sold">Verkocht</option></select></label>
   <label className="portal-checkline portal-full">
      <input type="checkbox" name="vat_deductible" checked={deductible} onChange={e=>setDeductible(e.target.checked)}/> BTW aftrekbaar
   </label>
   <details className="portal-extra portal-full"><summary>Opties en uitrusting</summary><div className="portal-options">{allOptions.map(name=><label key={name}>
     <input type="checkbox" name="options" value={name} checked={selectedOptions.includes(name)} onChange={e=>setSelectedOptions(prev=>e.target.checked?[...prev,name]:prev.filter(x=>x!==name))}/>{name}
   </label>)}</div></details>
   <label className="portal-full">Omschrijving<textarea name="description" rows={5} value={values.description||""} onChange={e=>change("description",e.target.value)}/></label>
   {state.error&&<p role="alert" className="portal-form-error portal-full">{state.error} Je ingevulde gegevens blijven behouden.</p>}
   <button type="submit" disabled={pending} className="portal-button portal-full">{pending?"Opslaan…":"Wijzigingen opslaan"}</button>
 </form>;
}
