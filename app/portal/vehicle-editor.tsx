"use client";
import {useActionState,useEffect,useMemo,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {createBrowserClient} from "@supabase/ssr";
import {supabaseBrowserConfig} from "@/lib/supabase/env";
import {vehicleChecked} from "./improvements";
import {CatalogVehicleSelector} from "./catalog-vehicle-selector";
import {loadInitialCatalog,type CatalogMake,type EquipmentItem} from "@/lib/dealer/catalog-client";
import {vehicleSpecificationFields,isApplicable,type SpecField} from "@/lib/dealer/vehicle-fields";

const steps=["Voertuig","Techniek","Uitrusting","Kleuren en interieur","Staat en onderhoud","Prijs en btw","Foto's en tekst","Controle"];
const fuels=["Benzine","Diesel","Elektrisch","Hybride","Plug-in hybride","LPG","CNG","Waterstof","Overig"];
const scalar=["make","model","version","vehicle_class","generation_code","motorization","trim_line","year","mileage_km","price_eur","fuel","transmission","body_type","power_hp","power_kw","emission_class","color","interior_color","drivetrain","condition","seats","doors","first_registration","vin","source_ref","description","vat_regime","condition_notes","maintenance_history","accident_history","warranty_months","catalog_make_id","catalog_model_id","catalog_generation_id","catalog_powertrain_id","catalog_trim_id"];
const technical=new Set(["displacement_cc","cylinders","power_kw","torque_nm","gears","top_speed_kmh","acceleration_0_100_s","co2_g_km","consumption_l_100km","emission_test","weight_kg","gross_weight_kg","towing_braked_kg","towing_unbraked_kg","wheelbase_mm","length_mm","width_mm","height_mm","engine_emission_standard","battery_capacity_kwh","battery_usable_kwh","battery_soh_percent","wltp_range_km","real_world_range_km","ac_charge_kw","dc_charge_kw","charge_10_80_minutes","electric_consumption_kwh_100km","charging_socket","battery_owned","battery_health_test_date","payload_kg","cargo_length_mm","cargo_width_mm","cargo_height_mm","pallet_capacity","operating_hours","axle_count","sleeping_capacity","water_tank_l","length_category"]);
const appearance=new Set(["wheel_size_inch","tyre_condition","paint_finish","original_paint","interior_material","seat_count_rows","steering_position"]);
const history=new Set(["previous_owners","carpass_available","accident_free","service_book_available","full_service_history","technical_inspection_until","origin_country","non_smoking","number_of_keys","last_service_mileage_km"]);
const finance=new Set(["price_negotiable","price_includes_vat","leasing_possible","delivery_period_days"]);
const mappedFuel=(value:string)=>value==="Elektrisch"?"electric":value==="Plug-in hybride"?"plug_in_hybrid":"other";
export function VehicleEditor({dealerId}:{dealerId:string}){
 const router=useRouter();
 const [result,submit,pending]=useActionState(vehicleChecked,{error:""});
 const [step,setStep]=useState(0);
 const [values,setValues]=useState<Record<string,string>>({vehicle_class:"car",vat_regime:"op_aanvraag"});
 const [codes,setCodes]=useState<string[]>([]);
 const [query,setQuery]=useState("");
 const [makes,setMakes]=useState<CatalogMake[]>([]);
 const [equipment,setEquipment]=useState<EquipmentItem[]>([]);
 const [catalogError,setCatalogError]=useState("");
 const [photos,setPhotos]=useState<File[]>([]);
 const [feedback,setFeedback]=useState("");
 const [uploading,setUploading]=useState("");
 const ready=useRef(false),finished=useRef(false);
 const draftKey="ikkenauto:vehicle-draft:"+dealerId;
 const fuel=values.fuel||"",className=values.vehicle_class||"car";
 const equipMap=useMemo(()=>new Map(equipment.map(x=>[x.code,x])),[equipment]);
 useEffect(()=>{
  let live=true;
  loadInitialCatalog().then(d=>{if(live){setMakes(d.makes);setEquipment(d.equipment);setCatalogError("");}})
   .catch(()=>{if(live)setCatalogError("De catalogus kan niet worden geladen. Vernieuw de pagina om opties te kiezen.");});
  return ()=>{live=false};
 },[]);
 useEffect(()=>{
  try{const saved=sessionStorage.getItem(draftKey);
   if(saved){const parsed=JSON.parse(saved);if(parsed.values)setValues({...parsed.values,vin:""});
    if(Array.isArray(parsed.codes))setCodes(parsed.codes);
    if(Number.isInteger(parsed.step)&&parsed.step>=0&&parsed.step<=7)setStep(parsed.step);}
  }catch{}
  ready.current=true;
 },[draftKey]);
 useEffect(()=>{
  if(!ready.current||result.vehicleId)return;
  const timeout=window.setTimeout(()=>{
   try{const {vin,...safe}=values;void vin;
    sessionStorage.setItem(draftKey,JSON.stringify({values:safe,codes,step}));}catch{}
  },500);
  return ()=>window.clearTimeout(timeout);
 },[values,codes,step,draftKey,result.vehicleId]);
 useEffect(()=>{
  const vehicleId=result.vehicleId;if(!vehicleId||finished.current)return;finished.current=true;
  try{sessionStorage.removeItem(draftKey);}catch{}
  async function upload(){
   let ok=0,fail=0;const cfg=supabaseBrowserConfig();
   if(cfg&&photos.length){
    const db=createBrowserClient(cfg.url,cfg.anonKey);
    for(let i=0;i<photos.length;i++){
     const file=photos[i];setUploading("Foto "+(i+1)+" van "+photos.length+" uploaden…");
     try{
      const ext=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";
      const path=dealerId+"/"+vehicleId+"/"+crypto.randomUUID()+"."+ext;
      const up=await db.storage.from("portal-vehicles").upload(path,file,{contentType:file.type,upsert:false});
      if(up.error){fail++;continue;}
      const row=await db.from("portal_vehicle_photos").insert({dealer_id:dealerId,vehicle_id:vehicleId,storage_path:path});
      if(row.error){fail++;await db.storage.from("portal-vehicles").remove([path]);continue;}
      ok++;
     }catch{fail++;}
    }
   }else if(photos.length)fail=photos.length;
   const msg=photos.length?(ok+" foto's opgeslagen"+(fail?", "+fail+" mislukt":"")+". Het voertuig is een privéconcept."):"Voertuig opgeslagen als privéconcept. Voeg foto's toe wanneer je wilt.";
   router.replace("/portal/voorraad/"+vehicleId+"/bewerken?success="+encodeURIComponent(msg)+"#photos");
  }
  void upload();
 },[result.vehicleId,photos,draftKey,dealerId,router]);
 function update(patch:Record<string,string>){
  setValues(v=>({...v,...patch}));setFeedback("");
  if("fuel" in patch||"vehicle_class" in patch){
   const nextFuel=mappedFuel(patch.fuel??fuel),nextClass=patch.vehicle_class??className;
   setCodes(previous=>previous.filter(code=>{const e=equipMap.get(code);
    return e&&(!e.compatible_fuels.length||e.compatible_fuels.includes(nextFuel)||e.compatible_fuels.includes(nextClass));}));
  }
 }
 const field=(name:string,label:string,type="text",placeholder="")=><label key={name} className="dealer-form-field">
  <span>{label}</span><input type={type} min={type==="number"?0:undefined} step={type==="number"?"any":undefined}
   value={values[name]||""} placeholder={placeholder} onChange={e=>update({[name]:e.target.value})}/>
 </label>;
 const select=(name:string,label:string,opts:string[])=><label key={name} className="dealer-form-field"><span>{label}</span>
  <select value={values[name]||""} onChange={e=>update({[name]:e.target.value})}>
   <option value="">Niet opgegeven</option>{opts.map(v=><option value={v} key={v}>{v}</option>)}
  </select></label>;
 function spec(f:SpecField){
  if(!isApplicable(f,fuel,className))return null;
  const key="spec."+f.key,value=values[key]||"";
  return <label key={f.key} className={"dealer-form-field"+(f.type==="checkbox"?" dealer-spec-toggle":"")}>
   <span>{f.label}{f.unit?" ("+f.unit+")":""}</span>
   {f.type==="checkbox"?<input type="checkbox" checked={value==="true"} onChange={e=>update({[key]:e.target.checked?"true":""})}/>:
    f.type==="select"?<select value={value} onChange={e=>update({[key]:e.target.value})}>
      <option value="">Niet bekend</option>{f.options?.map(x=><option key={x} value={x}>{x}</option>)}</select>:
    <input type={f.type==="number"?"number":"text"} min={f.type==="number"?0:undefined} max={f.max} step={f.type==="number"?"any":undefined}
     value={value} placeholder={f.hint||""} onChange={e=>update({[key]:e.target.value})}/>}
  </label>;
 }
 const specGroup=(ids:Set<string>)=><div className="dealer-form-grid">{vehicleSpecificationFields.filter(f=>ids.has(f.key)).map(spec)}</div>;
 const candidates=equipment.filter(e=>(!e.compatible_fuels.length||e.compatible_fuels.includes(mappedFuel(fuel))||e.compatible_fuels.includes(className))&&
  (!query||e.label_nl.toLocaleLowerCase("nl-BE").includes(query.toLocaleLowerCase("nl-BE"))||e.category.toLocaleLowerCase("nl-BE").includes(query.toLocaleLowerCase("nl-BE"))));
 const categories=[...new Set(candidates.map(e=>e.category))];
 const specifications=Object.fromEntries(Object.entries(values).filter(([k,v])=>k.startsWith("spec.")&&v!=="").map(([k,v])=>[k.slice(5),v==="true"?true:v]));
 function next(){
  if(step===0&&(!values.make?.trim()||!values.model?.trim()))return setFeedback("Kies een merk en model of vul ze zelf in.");
  if(step===1){
   const y=Number(values.year||0),km=Number(values.mileage_km||-1);
   if(!Number.isInteger(y)||y<1900||y>new Date().getFullYear()+1)return setFeedback("Controleer het bouwjaar.");
   if(!values.mileage_km?.trim()||!Number.isInteger(km)||km<0||km>5000000)return setFeedback("Controleer de kilometerstand.");
  }
  if(step===5){const p=Number((values.price_eur||"").replace(",","."));if(!Number.isFinite(p)||p<=0)return setFeedback("Vul een geldige verkoopprijs in.");}
  if(step===6&&(photos.length>10||photos.some(p=>p.size===0||p.size>3500000||!["image/jpeg","image/png","image/webp"].includes(p.type))))
   return setFeedback("Maximaal 10 foto's (JPG/PNG/WebP), elk maximaal 3,5 MB.");
  setFeedback("");setStep(i=>Math.min(7,i+1));
 }
 function reset(){
  if(!window.confirm("Alle tijdelijke formuliergegevens wissen?"))return;
  setValues({vehicle_class:"car",vat_regime:"op_aanvraag"});setCodes([]);setPhotos([]);setStep(0);
  try{sessionStorage.removeItem(draftKey);}catch{}
 }
 return <div className="dealer-wizard dealer-full-wizard">
  <div className="dealer-wizard-top">
   <div><span className="dealer-eyebrow">IKKENAUTO · VOERTUIGBEHEER</span><h1>Voertuig toevoegen</h1>
    <p>Vul stapsgewijs alle relevante voertuiggegevens in. Een onbekende uitvoering mag je zelf toevoegen.</p></div>
   <button className="dealer-draft-reset" type="button" onClick={reset} disabled={pending||!!result.vehicleId}>Formulier wissen</button>
  </div>
  <nav className="dealer-wizard-stepnav" aria-label="Voortgang">
   <ol>{steps.map((label,i)=><li key={label}>
    <button type="button" className={step===i?"active":i<step?"complete":""} disabled={i>=step||pending||!!result.vehicleId}
     onClick={()=>{setStep(i);setFeedback("");}} aria-current={step===i?"step":undefined}>
     <span>{i<step?"✓":i+1}</span><small>{label}</small></button>
   </li>)}</ol>
  </nav>
  <div className="dealer-wizard-main">
   <div className="dealer-wizard-section-heading"><span className="dealer-step-counter">STAP {step+1} VAN 8</span><h2>{steps[step]}</h2></div>
   {step===0&&<section>
    <CatalogVehicleSelector values={values} makes={makes} update={update}/>
    <p className="dealer-wizard-footnote">De catalogus bevat suggesties, geen automatisch bevestigde voertuigkenmerken. Onbekende generaties en uitvoeringen kun je vrij invullen.</p>
   </section>}
   {step===1&&<section>
    <div className="dealer-form-grid">
     {field("year","Bouwjaar *","number","Bijv. 2022")}
     {field("mileage_km","Kilometerstand (km) *","number","Bijv. 58000")}
     {select("fuel","Brandstof",fuels)}
     {select("transmission","Versnellingsbak",["Manueel","Automaat","Semi-automaat","DSG","CVT","Andere"])}
     {field("power_hp","Vermogen (pk)","number")}
     {select("emission_class","Emissieklasse",["Euro 6e","Euro 6d","Euro 6","Euro 5","Euro 4","Euro 3","Elektrisch / n.v.t."])}
     {field("first_registration","Eerste inschrijving","text","MM/JJJJ")}
     {field("vin","Chassisnummer (VIN)","text","Optioneel")}
    </div>
    <details className="dealer-spec-disclosure"><summary>Geavanceerde technische details en elektrische laadgegevens</summary>{specGroup(technical)}</details>
   </section>}
   {step===2&&<section>
    <div className="dealer-equipment-toolbar"><label className="dealer-form-field"><span>Zoek in 224 uitrustingskenmerken</span>
     <input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Bijv. stoelmassage, luchtvering, matrix-led, warmtepomp"/></label>
     <p>{codes.length} geselecteerd</p>
    </div>
    {catalogError&&<p role="alert" className="portal-form-error">{catalogError}</p>}
    {!equipment.length&&!catalogError&&<p>Uitrusting laden…</p>}
    {categories.map(category=><details key={category+(query?"-q":"")} open={query?true:undefined} className="dealer-equipment-group dealer-equipment-search-group">
     <summary>{category} <span>{candidates.filter(e=>e.category===category&&codes.includes(e.code)).length} geselecteerd</span></summary>
     <div className="dealer-equipment-grid">{candidates.filter(e=>e.category===category).map(e=><label className="dealer-equipment-option" key={e.code}>
      <input type="checkbox" checked={codes.includes(e.code)} onChange={ev=>setCodes(old=>ev.target.checked?[...old,e.code]:old.filter(x=>x!==e.code))}/>
      <span>{e.label_nl}</span></label>)}</div>
    </details>)}
    {!categories.length&&equipment.length>0&&<p>Geen overeenkomende opties gevonden.</p>}
   </section>}
   {step===3&&<section>
    <div className="dealer-form-grid">
     {select("body_type","Carrosserie",["SUV","Berline","Hatchback","Break","Coupé","Cabrio","Monovolume","Bestelwagen","Pick-up","Camper","Andere"])}
     {field("color","Exterieurkleur","text","Bijv. Selenietgrijs metallic")}
     {field("interior_color","Interieurkleur","text","Bijv. zwart")}
     {select("drivetrain","Aandrijving",["Voorwielaandrijving","Achterwielaandrijving","Vierwielaandrijving"])}
     {select("seats","Zitplaatsen",Array.from({length:30},(_,i)=>String(i+1)))}
     {select("doors","Aantal deuren",["1","2","3","4","5","6","7","8"])}
    </div>
    <details className="dealer-spec-disclosure"><summary>Velgen, banden, interieurmateriaal en afwerking</summary>{specGroup(appearance)}</details>
   </section>}
   {step===4&&<section>
    <div className="dealer-form-grid">{select("condition","Staat",["Nieuw","Tweedehands","Demowagen","Oldtimer","Schadevoertuig","Niet rijklaar"])}
     {field("warranty_months","Garantie (maanden)","number","Bijv. 12")}
     {field("source_ref","Eigen stocknummer","text","Bijv. CAR-003")}</div>
    {["maintenance_history","accident_history","condition_notes"].map((key,i)=><label key={key} className="dealer-form-field dealer-full-row">
     <span>{["Onderhoudshistoriek","Schadehistoriek","Opmerkingen over de staat"][i]}</span>
     <textarea rows={3} maxLength={2000} value={values[key]||""} onChange={e=>update({[key]:e.target.value})}
      placeholder="Vermeld uitsluitend informatie die je kunt bevestigen."/></label>)}
    <details className="dealer-spec-disclosure"><summary>Car-Pass, onderhoud, vorige eigenaars en keuring</summary>{specGroup(history)}</details>
   </section>}
   {step===5&&<section>
    <div className="dealer-form-grid">{field("price_eur","Verkoopprijs (€) *","number","Bijv. 29990")}
     <label className="dealer-form-field"><span>BTW-regime</span>
      <select value={values.vat_regime||"op_aanvraag"} onChange={e=>update({vat_regime:e.target.value})}>
       <option value="op_aanvraag">Nog niet opgegeven</option><option value="btw">BTW aftrekbaar</option>
       <option value="marge">Margeregeling</option><option value="vrijgesteld">Vrijgesteld</option>
       <option value="particulier">Particulier</option></select>
      <small>Controleer zelf het fiscale regime.</small>
     </label></div>
    <details className="dealer-spec-disclosure"><summary>Onderhandelen, leasing en beschikbaarheid</summary>{specGroup(finance)}</details>
   </section>}
   {step===6&&<section>
    <p className="dealer-wizard-footnote">Foto&apos;s worden na het opslaan van het privéconcept direct naar de beveiligde opslag geüpload. Gebruik eigen of toegestane foto&apos;s.</p>
    <label className="dealer-form-field"><span>Foto&apos;s kiezen (maximaal 10 tegelijk, 3,5 MB per foto)</span>
     <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>setPhotos(Array.from(e.target.files||[]))}/></label>
    <p className="dealer-wizard-footnote">{photos.length} foto&apos;s geselecteerd. Bestanden blijven niet in de tijdelijke browseropslag bewaard.</p>
    <label className="dealer-form-field dealer-full-row"><span>Advertentiebeschrijving</span>
     <textarea rows={7} maxLength={4000} value={values.description||""} onChange={e=>update({description:e.target.value})}
      placeholder="Beschrijf de werkelijke staat, onderhoud en uitrusting. Geen onbevestigde claims."/></label>
   </section>}
   {step===7&&<section>
    <div className="dealer-review-list">
     {[["Merk en model",(values.make||"")+" "+(values.model||"")],["Generatie",values.generation_code||"Niet opgegeven"],
      ["Motorisatie",values.motorization||"Niet opgegeven"],["Uitvoering",values.trim_line||"Niet opgegeven"],
      ["Bouwjaar",values.year||"—"],["Kilometerstand",(values.mileage_km||"—")+" km"],
      ["Prijs","€ "+Number(values.price_eur||0).toLocaleString("nl-BE")],["Uitrusting",codes.length+" opties"],
      ["Foto's",photos.length+" gekozen"]].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}
    </div>
    <div className="dealer-note-box"><strong>Concept, nog niet publiek</strong>
     <p>IKKENAUTO slaat je auto eerst privé op en uploadt daarna de gekozen foto&apos;s. Er verschijnt nog geen publieke advertentie op de niet-gelanceerde marktplaats.</p></div>
    <form id="dealer-wizard-submit" action={submit}>
     {scalar.map(key=><input type="hidden" key={key} name={key} value={key==="power_kw"?(values["spec.power_kw"]||""):values[key]||""}/>)}
     <input type="hidden" name="specifications" value={JSON.stringify(specifications)}/>
     {codes.map(code=><input key={code} type="hidden" name="equipment_codes" value={code}/>)}
     {result.error&&<p role="alert" className="portal-form-error">{result.error} Ingevoerde gegevens zijn behouden.</p>}
     {uploading&&<p role="status" className="dealer-upload-progress">{uploading}</p>}
    </form>
   </section>}
   {feedback&&<p role="alert" className="portal-form-error dealer-wizard-error">{feedback}</p>}
   <div className="dealer-wizard-actions">
    {step>0?<button type="button" className="dealer-button-secondary" onClick={()=>{setStep(s=>Math.max(0,s-1));setFeedback("");}} disabled={pending||!!result.vehicleId}>Vorige</button>:
     <span className="dealer-wizard-helper">* verplicht · tijdelijk automatisch bewaard in deze browsersessie</span>}
    {step<7?<button type="button" onClick={next} className="portal-button dealer-wizard-next">Volgende →</button>:
     <button type="submit" form="dealer-wizard-submit" disabled={pending||!!result.vehicleId} className="portal-button dealer-wizard-next">
      {pending||result.vehicleId?"Concept verwerken…":"Concept opslaan en foto's uploaden"}</button>}
   </div>
  </div>
 </div>;
}
