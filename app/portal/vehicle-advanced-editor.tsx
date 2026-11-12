"use client";

import {useEffect,useMemo,useState} from "react";
import {loadInitialCatalog,type EquipmentItem} from "@/lib/dealer/catalog-client";
import {vehicleSpecificationFields,isApplicable} from "@/lib/dealer/vehicle-fields";

type V = string|number|boolean;
function fromRecord(input: Record<string,unknown>|null): Record<string,string> {
 if(!input)return {};
 return Object.fromEntries(Object.entries(input).filter(([,v])=>typeof v==="string"||typeof v==="number"||typeof v==="boolean")
   .map(([k,v])=>[k,v===true?"true":v===false?"":String(v)]));
}
const shortSpecLabels=new Set(["displacement_cc","power_kw","battery_capacity_kwh","wltp_range_km","battery_soh_percent","ac_charge_kw","dc_charge_kw","towing_braked_kg","weight_kg","interior_material","previous_owners","carpass_available"]);
export function VehicleAdvancedEditor({initialSpecifications,initialCodes,originalOptions,fuel,vehicleClass}:{
 initialSpecifications:Record<string,unknown>|null;
 initialCodes:string[]|null;
 originalOptions:string[]|null;
 fuel:string;
 vehicleClass:string;
}){
 const [specValues,setSpecValues]=useState<Record<string,string>>(()=>fromRecord(initialSpecifications));
 const [catalog,setCatalog]=useState<EquipmentItem[]>([]);
 const [codes,setCodes]=useState<string[]>(initialCodes||[]);
 const [legacyOptions]=useState<string[]>(originalOptions||[]);
 const [search,setSearch]=useState("");
 const [error,setError]=useState("");
 const [expand,setExpand]=useState(false);
 useEffect(()=>{
  let active=true;
  loadInitialCatalog().then(d=>{if(active){setCatalog(d.equipment);setError("");
   const fromLegacy=legacyOptions.map(label=>d.equipment.find(item=>item.label_nl===label)?.code).filter((code):code is string=>Boolean(code));
   setCodes(existing=>[...new Set([...existing,...fromLegacy])]);
  }})
    .catch(()=>{if(active)setError("De uitrustingscatalogus is niet bereikbaar. De bestaande opties blijven bewaard.");});
  return ()=>{active=false;};
 },[legacyOptions]);
 const fuelToken=fuel==="Elektrisch"?"electric":fuel==="Plug-in hybride"?"plug_in_hybrid":"other";
 const allowed=useMemo(()=>catalog.filter(item=>!item.compatible_fuels?.length
  ||item.compatible_fuels.includes(fuelToken)||item.compatible_fuels.includes(vehicleClass)),[catalog,fuelToken,vehicleClass]);
 const filtered=allowed.filter(item=>!search||item.label_nl.toLocaleLowerCase("nl-BE").includes(search.toLocaleLowerCase("nl-BE"))
  ||item.category.toLocaleLowerCase("nl-BE").includes(search.toLocaleLowerCase("nl-BE")));
 const categories=[...new Set(filtered.map(x=>x.category))];
 const codeList=codes.filter(code=>allowed.some(item=>item.code===code));
 const unmatchedLegacy=legacyOptions.filter(label=>!catalog.some(item=>item.label_nl===label));
 const specObj:Record<string,V>={};
 for(const def of vehicleSpecificationFields){
  if(!isApplicable(def,fuel,vehicleClass))continue;
  const raw=specValues[def.key];
  if(!raw)continue;
  if(def.type==="checkbox"){if(raw==="true")specObj[def.key]=true;}
  else if(def.type==="number"){
   const number=Number(raw);
   if(Number.isFinite(number)&&number>=0&&number<=(def.max??100000))specObj[def.key]=number;
  }else specObj[def.key]=raw;
 }
 function update(key:string,next:string){setSpecValues(s=>({...s,[key]:next}));}
 return <div className="dealer-advanced-edit">
   <input type="hidden" name="specifications" value={JSON.stringify(specObj)}/>
   <input type="hidden" name="catalog_equipment_loaded" value={catalog.length?"yes":"no"}/>
   {codeList.map(code=><input type="hidden" key={code} name="equipment_codes" value={code}/>)}
   {!catalog.length&&codes.map(code=><input type="hidden" key={code} name="equipment_codes" value={code}/>)}
   {/* The original text array is kept if the catalog is temporarily offline. */}
   {unmatchedLegacy.map(label=><input type="hidden" key={label} name="options" value={label}/>)}
   <section className="dealer-edit-section">
    <div className="dealer-edit-section-heading"><h3>Uitgebreide technische gegevens</h3><p>WLTP, batterij, laadvermogen, banden, onderhoud en technische voertuigkenmerken.</p></div>
    <div className="dealer-form-grid">
     {vehicleSpecificationFields.filter(f=>shortSpecLabels.has(f.key)&&isApplicable(f,fuel,vehicleClass)).map(field=><label key={field.key} className="dealer-form-field">
      <span>{field.label}{field.unit?" ("+field.unit+")":""}</span>
      {field.type==="checkbox"?<input type="checkbox" checked={specValues[field.key]==="true"} onChange={e=>update(field.key,e.target.checked?"true":"")}/>:
      field.type==="select"?<select value={specValues[field.key]||""} onChange={e=>update(field.key,e.target.value)}><option value="">Niet bekend</option>{field.options?.map(v=><option key={v} value={v}>{v}</option>)}</select>:
      <input type={field.type==="number"?"number":"text"} min={field.type==="number"?0:undefined} max={field.max}
       value={specValues[field.key]||""} onChange={e=>update(field.key,e.target.value)}/>}
     </label>)}
    </div>
    <button type="button" className="dealer-button-secondary dealer-expand-specs" onClick={()=>setExpand(v=>!v)}
      aria-expanded={expand}>{expand?"Minder details":"Alle technische en historische details"}</button>
    {expand&&<div className="dealer-form-grid dealer-advanced-spec-grid">
     {vehicleSpecificationFields.filter(f=>!shortSpecLabels.has(f.key)&&isApplicable(f,fuel,vehicleClass)).map(field=><label className="dealer-form-field" key={field.key}>
      <span>{field.label}{field.unit?" ("+field.unit+")":""}</span>
      {field.type==="checkbox"?<input type="checkbox" checked={specValues[field.key]==="true"} onChange={e=>update(field.key,e.target.checked?"true":"")}/>:
      field.type==="select"?<select value={specValues[field.key]||""} onChange={e=>update(field.key,e.target.value)}>
       <option value="">Niet bekend</option>{field.options?.map(v=><option key={v} value={v}>{v}</option>)}</select>:
      <input type={field.type==="number"?"number":"text"} min={field.type==="number"?0:undefined} max={field.max}
       value={specValues[field.key]||""} onChange={e=>update(field.key,e.target.value)} placeholder={field.hint||""}/>}
     </label>)}
    </div>}
   </section>
   <section className="dealer-edit-section">
    <div className="dealer-edit-section-heading"><h3>Alle uitrusting</h3><p>Zoek de aanwezige opties. Geen enkele optie wordt automatisch als aanwezig gemarkeerd.</p></div>
    <label className="dealer-form-field"><span>Zoeken in uitrusting</span>
     <input type="search" value={search} onChange={e=>setSearch(e.target.value)}
      placeholder="Bijv. matrixverlichting, luchtvering, achterasbesturing" autoComplete="off"/>
    </label>
    <p className="dealer-wizard-footnote">{codes.length} kenmerken geselecteerd · {catalog.length} beschikbare opties</p>
    {error&&<p className="portal-form-error" role="alert">{error}</p>}
    {categories.map(category=><details className="dealer-equipment-group dealer-equipment-search-group"
      open={Boolean(search)||undefined} key={category+(search?"-search":"")}>
      <summary>{category}</summary>
      <div className="dealer-equipment-grid">
       {filtered.filter(item=>item.category===category).map(item=><label className="dealer-equipment-option" key={item.code}>
        <input type="checkbox" checked={codes.includes(item.code)} onChange={e=>setCodes(old=>e.target.checked?[...old,item.code]:old.filter(code=>code!==item.code))}/>
        <span>{item.label_nl}</span>
       </label>)}
      </div>
     </details>)}
   </section>
  </div>;
}
