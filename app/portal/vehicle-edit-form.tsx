"use client";

import { useActionState, useState } from "react";
import { updateVehicle } from "./vehicle-edit-actions";
import { vehicleMakes, suggestedModels } from "@/lib/dealer/vehicle-catalog";

type VehicleRecord = {
  id:string;make:string;model:string;version:string|null;price_eur:number;year:number|null;
  mileage_km:number|null;fuel:string|null;transmission:string|null;body_type:string|null;
  color:string|null;interior_color:string|null;drivetrain:string|null;
  first_registration:string|null;vin:string|null;
  emission_class:string|null;condition:string|null;source_ref:string|null;
  seats:number|null;doors:number|null;power_hp:number|null;description:string|null;
  status:string;vat_deductible:boolean;options:string[]|null;
};
const fuelTypes=["Benzine","Diesel","Elektrisch","Hybride","Plug-in hybride","LPG","CNG","Waterstof","Overig"];
const gearbox=["Automaat","Manueel","Semi-automaat"];
const bodyTypes=["SUV","Berline","Hatchback","Break","Coupé","Cabrio","Monovolume","Bestelwagen","Pick-up","Andere"];
const equipmentGroups=[
 {title:"Comfort",values:["Airconditioning","Automatische klimaatregeling","Verwarmde zetels","Elektrische zetels","Lederen bekleding","Keyless entry","Elektrische achterklep","Panoramadak"]},
 {title:"Veiligheid",values:["Cruisecontrol","Adaptieve cruisecontrol","Achteruitrijcamera","360° camera","Parkeersensoren voor","Parkeersensoren achter","Dodehoekwaarschuwing","Rijstrookassistent","Isofix"]},
 {title:"Multimedia en exterieur",values:["Navigatie","Apple CarPlay","Android Auto","Bluetooth","Head-updisplay","Ledkoplampen","Matrix-led","Lichtmetalen velgen","Sportpakket","Trekhaak"]},
];
export function VehicleEditForm({vehicle}:{vehicle:VehicleRecord}) {
 const [state,save,pending]=useActionState(updateVehicle,{error:""});
 const [values,setValues]=useState<Record<string,string>>({
  make:vehicle.make,model:vehicle.model,version:vehicle.version||"",price_eur:String(vehicle.price_eur),
  year:vehicle.year===null?"":String(vehicle.year),
  mileage_km:vehicle.mileage_km===null?"":String(vehicle.mileage_km),
  fuel:vehicle.fuel||"",transmission:vehicle.transmission||"",body_type:vehicle.body_type||"",
  color:vehicle.color||"",interior_color:vehicle.interior_color||"",drivetrain:vehicle.drivetrain||"",
  first_registration:vehicle.first_registration||"",vin:vehicle.vin||"",
  emission_class:vehicle.emission_class||"",condition:vehicle.condition||"",
  source_ref:vehicle.source_ref||"",seats:vehicle.seats===null?"":String(vehicle.seats),
  doors:vehicle.doors===null?"":String(vehicle.doors),
  power_hp:vehicle.power_hp===null?"":String(vehicle.power_hp),
  description:vehicle.description||"",status:vehicle.status,
 });
 const [deductible,setDeductible]=useState(Boolean(vehicle.vat_deductible));
 const [selectedOptions,setSelectedOptions]=useState<string[]>(vehicle.options||[]);
 const edit=(name:string,v:string)=>setValues(previous=>({...previous,[name]:v,...(name==="make"&&previous.make!==v?{model:""}:{})}));
 const input=(name:string,label:string,opts:{type?:string;required?:boolean;placeholder?:string}={})=><label className="dealer-form-field" key={name}>
   <span>{label}{opts.required&&<b aria-hidden="true"> *</b>}</span>
   <input name={name} type={opts.type||"text"} required={opts.required} placeholder={opts.placeholder}
    min={opts.type==="number"?"0":undefined} value={values[name]??""} onChange={e=>edit(name,e.target.value)}/>
  </label>;
 const select=(name:string,label:string,options:readonly string[])=><label className="dealer-form-field" key={name}>
  <span>{label}</span><select name={name} value={values[name]||""} onChange={e=>edit(name,e.target.value)}>
   <option value="">Niet opgegeven</option>{options.map(x=><option key={x} value={x}>{x}</option>)}
  </select></label>;
 const known=equipmentGroups.flatMap(g=>g.values);
 const other=selectedOptions.filter(x=>!known.includes(x));
 function option(name:string){return <label className="dealer-equipment-option" key={name}>
   <input type="checkbox" name="options" value={name} checked={selectedOptions.includes(name)}
     onChange={e=>setSelectedOptions(previous=>e.target.checked?[...previous,name]:previous.filter(x=>x!==name))}/>
   <span>{name}</span>
  </label>;}
 return <form action={save} className="portal-form dealer-edit-form" id="vehicle-edit-form">
  <input type="hidden" name="vehicle_id" value={vehicle.id}/>
  <section className="dealer-edit-section">
   <div className="dealer-edit-section-heading"><h3>Basisgegevens</h3><p>Deze informatie verschijnt bij je auto in de voorraad.</p></div>
   <div className="dealer-form-grid">
    <label className="dealer-form-field"><span>Merk <b aria-hidden="true">*</b></span>
     <input name="make" list="edit-vehicle-makes" required value={values.make} onChange={e=>edit("make",e.target.value)} placeholder="Kies of typ merk"/>
     <datalist id="edit-vehicle-makes">{vehicleMakes.map(make=><option key={make} value={make}/>)}</datalist>
    </label>
    <label className="dealer-form-field"><span>Model <b aria-hidden="true">*</b></span>
     <input name="model" list="edit-vehicle-models" required value={values.model} onChange={e=>edit("model",e.target.value)} placeholder="Bijv. Golf"/>
     <datalist id="edit-vehicle-models">{suggestedModels(values.make).map(model=><option key={model} value={model}/>)}</datalist>
    </label>
    {input("version","Uitvoering",{placeholder:"Bijv. GTI, M Sport"})}
    {input("price_eur","Verkoopprijs (€)",{type:"number",required:true})}
    {input("year","Bouwjaar",{type:"number"})}
    {input("mileage_km","Kilometerstand (km)",{type:"number"})}
   </div>
  </section>

  <section className="dealer-edit-section">
   <div className="dealer-edit-section-heading"><h3>Kenmerken</h3><p>Technische details, status en je eigen stocknummer.</p></div>
   <div className="dealer-form-grid">
    {select("fuel","Brandstof",fuelTypes)}
    {select("transmission","Versnellingsbak",gearbox)}
    {select("body_type","Carrosserie",bodyTypes)}
    {select("condition","Staat",["Nieuw","Tweedehands","Demowagen","Oldtimer","Schadevoertuig"])}
    {select("color","Buitenkleur",["Zwart","Wit","Grijs","Zilver","Blauw","Rood","Groen","Bruin","Beige","Goud","Andere"])}
    {select("interior_color","Interieurkleur",["Zwart","Grijs","Beige","Bruin","Andere"])}
    {select("drivetrain","Aandrijving",["Voorwielaandrijving","Achterwielaandrijving","Vierwielaandrijving"])}
    {select("emission_class","Emissieklasse",["Euro 6e","Euro 6d","Euro 6","Euro 5","Euro 4","Euro 3","Elektrisch / n.v.t."])}
    {select("seats","Zitplaatsen",Array.from({length:10},(_,i)=>String(i+1)))}
    {select("doors","Aantal deuren",["2","3","4","5","6"])}
    {input("power_hp","Vermogen (pk)",{type:"number"})}
    {input("first_registration","Eerste inschrijving",{placeholder:"MM/JJJJ"})}
    {input("vin","Chassisnummer (VIN)",{placeholder:"17 tekens"})}
    {input("source_ref","Eigen stocknummer",{placeholder:"Bijv. GARAGE-001"})}
    <label className="dealer-form-field"><span>Voorraadstatus</span><select name="status" value={values.status} onChange={e=>edit("status",e.target.value)}>
     <option value="draft">Concept</option><option value="ready">Klaar voor lancering</option><option value="sold">Verkocht</option>
    </select></label>
    <label className="dealer-equipment-option dealer-vat-option"><input type="checkbox" name="vat_deductible" checked={deductible} onChange={e=>setDeductible(e.target.checked)}/><span>BTW aftrekbaar</span></label>
   </div>
  </section>

  <section className="dealer-edit-section">
   <div className="dealer-edit-section-heading"><h3>Beschrijving en uitrusting</h3><p>Voeg alleen toe wat op dit voertuig aanwezig is.</p></div>
   <details className="dealer-edit-options">
    <summary>Opties en uitrusting <span>{selectedOptions.length} geselecteerd</span></summary>
    <div className="dealer-edit-equipment">
     {equipmentGroups.map(group=><fieldset className="dealer-equipment-group" key={group.title}>
      <legend>{group.title}</legend><div className="dealer-equipment-grid">{group.values.map(option)}</div>
     </fieldset>)}
     {other.length>0&&<fieldset className="dealer-equipment-group"><legend>Overige bestaande opties</legend>
      <div className="dealer-equipment-grid">{other.map(option)}</div></fieldset>}
    </div>
   </details>
   <label className="dealer-form-field dealer-description-field"><span>Omschrijving</span>
    <textarea name="description" rows={5} maxLength={4000} value={values.description||""} onChange={e=>edit("description",e.target.value)} placeholder="Onderhoudshistoriek, technische staat en bijzonderheden"/>
   </label>
  </section>

  {state.error&&<p role="alert" className="portal-form-error">{state.error} Je wijzigingen blijven ingevuld.</p>}
  <div className="dealer-edit-submit">
   <p>Je gegevens blijven privé tot de lancering van de marktplaats.</p>
   <button type="submit" disabled={pending} className="portal-button">{pending?"Wijzigingen bewaren…":"Wijzigingen opslaan"}</button>
  </div>
 </form>;
}
