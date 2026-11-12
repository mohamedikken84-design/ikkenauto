"use client";

import { useEffect, useState } from "react";
import { vehicleMakes, suggestedModels } from "@/lib/dealer/vehicle-catalog";
import { loadCatalogChildren, type CatalogChild, type CatalogMake } from "@/lib/dealer/catalog-client";

type FormState = Record<string,string>;
export function CatalogVehicleSelector({
 values, makes, update,
}: { values:FormState; makes:CatalogMake[]; update:(patch:FormState)=>void }) {
 const [models,setModels]=useState<CatalogChild[]>([]);
 const [generations,setGenerations]=useState<CatalogChild[]>([]);
 const [powertrains,setPowertrains]=useState<CatalogChild[]>([]);
 const [trims,setTrims]=useState<CatalogChild[]>([]);
 const [error,setError]=useState("");
 function number(s?:string){const n=Number(s||"");return Number.isSafeInteger(n)&&n>0?n:0;}
 useEffect(()=>{
   let active=true;
   const id=number(values.catalog_make_id);
   if(id)loadCatalogChildren("models",id).then(result=>{if(active){setModels(result);setError("");}}).catch(()=>{if(active)setError("De modelsuggesties zijn tijdelijk niet beschikbaar. Je kunt het model vrij typen.");});
   return ()=>{active=false};
 },[values.catalog_make_id]);
 useEffect(()=>{
   let active=true;
   const id=number(values.catalog_model_id);
   if(id)loadCatalogChildren("generations",id).then(result=>{if(active){setGenerations(result);setError("");}}).catch(()=>{if(active)setError("Generaties tijdelijk niet beschikbaar. Vul de generatie zelf in.");});
   return ()=>{active=false};
 },[values.catalog_model_id]);
 useEffect(()=>{
   let active=true;
   const id=number(values.catalog_generation_id);
   if(id)loadCatalogChildren("powertrains",id).then(result=>{if(active){setPowertrains(result);setError("");}}).catch(()=>{if(active)setError("Motorisaties tijdelijk niet beschikbaar. Vul deze zelf in.");});
   return ()=>{active=false};
 },[values.catalog_generation_id]);
 useEffect(()=>{
   let active=true;
   const id=number(values.catalog_powertrain_id);
   if(id)loadCatalogChildren("trims",id).then(result=>{if(active){setTrims(result);setError("");}}).catch(()=>{if(active)setError("Uitvoeringen tijdelijk niet beschikbaar. Vul ze zelf in.");});
   return ()=>{active=false};
 },[values.catalog_powertrain_id]);
 const clearModel={
   model:"",catalog_model_id:"",generation_code:"",catalog_generation_id:"",
   motorization:"",catalog_powertrain_id:"",trim_line:"",catalog_trim_id:"",
 };
 function selectMake(name:string){
   setModels([]);setGenerations([]);setPowertrains([]);setTrims([]);
   const match=makes.find(x=>x.name.toLocaleLowerCase("nl-BE")===name.trim().toLocaleLowerCase("nl-BE"));
   update({make:name,catalog_make_id:match?String(match.id):"",...clearModel});
 }
 function selectModel(name:string){
   setGenerations([]);setPowertrains([]);setTrims([]);
   const match=models.find(x=>x.name?.toLocaleLowerCase("nl-BE")===name.trim().toLocaleLowerCase("nl-BE"));
   update({model:name,catalog_model_id:match?String(match.id):"",
     generation_code:"",catalog_generation_id:"",motorization:"",catalog_powertrain_id:"",trim_line:"",catalog_trim_id:""});
 }
 const modelsList=models.map(m=>m.name||"").filter(Boolean);
 const generatedMakes=makes.length?makes.map(m=>m.name):vehicleMakes;
 return <div className="dealer-form-grid">
  <label className="dealer-form-field">
   <span>Voertuigcategorie</span>
   <select value={values.vehicle_class||"car"} onChange={e=>update({vehicle_class:e.target.value})}>
    <option value="car">Personenauto</option><option value="commercial">Bestelwagen / lichte vracht</option>
    <option value="motorhome">Camper</option><option value="truck">Vrachtwagen</option>
    <option value="motorcycle">Motorfiets</option><option value="other">Andere</option>
   </select>
   <small>Catalogussuggesties zijn voorlopig het uitgebreidst voor personenauto&apos;s.</small>
  </label>
  <label className="dealer-form-field">
   <span>Merk <b aria-hidden="true">*</b></span>
   <input list="ia-makes" value={values.make||""} onChange={e=>selectMake(e.target.value)} autoComplete="off" placeholder="Typ of kies het merk"/>
   <datalist id="ia-makes">{generatedMakes.map(make=><option key={make} value={make}/>)}</datalist>
  </label>
  <label className="dealer-form-field">
   <span>Model <b aria-hidden="true">*</b></span>
   <input list="ia-models" value={values.model||""} onChange={e=>selectModel(e.target.value)} placeholder="Typ of kies het model" autoComplete="off"/>
   <datalist id="ia-models">{(modelsList.length?modelsList:suggestedModels(values.make)).map(model=><option key={model} value={model}/>)}</datalist>
   <small>{values.catalog_make_id ? "De modellen passen bij het gekozen merk." : "Ander merk of model? Zelf invoeren mag."}</small>
  </label>
  <label className="dealer-form-field">
   <span>Generatie / modelcode</span>
   <select value={values.catalog_generation_id||""} disabled={!values.catalog_model_id||!generations.length} onChange={e=>{
     setPowertrains([]);setTrims([]);
     const match=generations.find(v=>String(v.id)===e.target.value);
     update({catalog_generation_id:e.target.value,generation_code:match?.code||"",motorization:"",catalog_powertrain_id:"",trim_line:"",catalog_trim_id:""});
   }}>
    <option value="">Niet gevonden / handmatig</option>
    {generations.map(g=><option key={g.id} value={g.id}>{g.code}{g.year_from?" · vanaf "+g.year_from:""}</option>)}
   </select>
   <input value={values.generation_code||""} onChange={e=>update({generation_code:e.target.value,catalog_generation_id:"",motorization:"",catalog_powertrain_id:"",trim_line:"",catalog_trim_id:""})} placeholder="Bijv. G05, W213, 992" maxLength={60}/>
  </label>
  <label className="dealer-form-field">
   <span>Motorisatie / versie</span>
   <input list="ia-motorization" value={values.motorization||""} onChange={e=>{
    setTrims([]);
    const name=e.target.value, match=powertrains.find(p=>p.name?.toLocaleLowerCase("nl-BE")===name.toLocaleLowerCase("nl-BE"));
    update({motorization:name,catalog_powertrain_id:match?String(match.id):"",trim_line:"",catalog_trim_id:""});
   }} placeholder="Bijv. xDrive30d, E 220 d, 1.5 eTSI" maxLength={100}/>
   <datalist id="ia-motorization">{powertrains.map(x=><option key={x.id} value={x.name||""}/>)}</datalist>
  </label>
  <label className="dealer-form-field">
   <span>Uitvoering / uitrustingslijn</span>
   <input list="ia-trim" value={values.trim_line||""} onChange={e=>{
    const name=e.target.value,match=trims.find(t=>t.name?.toLocaleLowerCase("nl-BE")===name.toLocaleLowerCase("nl-BE"));
    update({trim_line:name,catalog_trim_id:match?String(match.id):"",version:name});
   }} placeholder="Bijv. AMG Line, M Sport, GTI" maxLength={150}/>
   <datalist id="ia-trim">{trims.map(x=><option key={x.id} value={x.name||""}/>)}</datalist>
   <small>Geen uitrustingslijn bekend? Vul ze in zonder vooraf ingevulde uitrusting.</small>
  </label>
  {error&&<p role="status" className="portal-note dealer-full-row">{error}</p>}
 </div>;
}
