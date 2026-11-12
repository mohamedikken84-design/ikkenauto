"use client";
import {useActionState,useState} from "react";
import {vehicleChecked} from "./improvements";
const makes=["Abarth","Alfa Romeo","Alpine","Aston Martin","Audi","Bentley","BMW","BYD","Cadillac","Chevrolet","Chrysler","Citroën","Cupra","Dacia","Daewoo","Daihatsu","Dodge","DS","Ferrari","Fiat","Fisker","Ford","Genesis","Honda","Hyundai","Infiniti","Isuzu","Jaguar","Jeep","Kia","Lamborghini","Lancia","Land Rover","Lexus","Lotus","Maserati","Mazda","McLaren","Mercedes-Benz","MG","MINI","Mitsubishi","Nissan","Opel","Peugeot","Polestar","Porsche","Renault","Rolls-Royce","Saab","SEAT","Skoda","Smart","Subaru","Suzuki","Tesla","Toyota","Volkswagen","Volvo","Xpeng","Zeekr"];
const modelSuggestions:Record<string,string[]>={
 "Audi":["A1","A3","A4","A5","A6","A7","A8","Q2","Q3","Q4 e-tron","Q5","Q7","Q8","TT","e-tron GT"],
 "BMW":["1 Reeks","2 Reeks","3 Reeks","4 Reeks","5 Reeks","7 Reeks","8 Reeks","X1","X2","X3","X4","X5","X6","X7","i3","i4","i5","iX"],
 "Mercedes-Benz":["A-Klasse","B-Klasse","C-Klasse","E-Klasse","S-Klasse","CLA","CLS","GLA","GLB","GLC","GLE","GLS","V-Klasse","EQA","EQB","EQE","EQS"],
 "Volkswagen":["Golf","Polo","Passat","Tiguan","Tiguan Allspace","T-Roc","Touareg","Touran","ID.3","ID.4","ID.5","Caddy","Transporter","Arteon"],
 "Peugeot":["108","208","308","408","508","2008","3008","5008","Rifter","Traveller"],
 "Toyota":["Aygo","Yaris","Corolla","C-HR","RAV4","Prius","Camry","Land Cruiser","Hilux"],
 "Ford":["Fiesta","Focus","Puma","Kuga","Mondeo","Mustang","Ranger","Transit"],
 "Renault":["Clio","Captur","Megane","Austral","Arkana","Scenic","Espace","Kangoo"],
 "Volvo":["XC40","XC60","XC90","S60","S90","V60","V90","EX30","EX90"],
 "Porsche":["911","718 Boxster","718 Cayman","Macan","Cayenne","Panamera","Taycan"]
};
const equipment=["Airconditioning","Automatische klimaatregeling","Cruisecontrol","Adaptieve cruisecontrol","Navigatie","Apple CarPlay","Android Auto","Achteruitrijcamera","Parkeersensoren voor","Parkeersensoren achter","Ledkoplampen","Matrix-led","Panoramadak","Trekhaak","Verwarmde zetels","Elektrische zetels","Lederen bekleding","Isofix","Dodehoekwaarschuwing","Rijstrookassistent","Keyless entry","Elektrische achterklep","Bluetooth","Head-updisplay","360° camera","Sportpakket","Lichtmetalen velgen"];

type Values=Record<string,string>;
type VehicleDraft=Values&{options?:string[]};
export function VehicleEditor({initial,vehicleId}:{initial?:VehicleDraft;vehicleId?:string}){
 const [state,action,pending]=useActionState(vehicleChecked,{error:""});
 const [step,setStep]=useState(0);
 const [form,setForm]=useState<Values>(()=>{const r={...initial};delete r.options;return r;});
 const [chosen,setChosen]=useState<string[]>(initial?.options||[]);
 const [notice,setNotice]=useState("");
 const steps=["Voertuig","Specificaties","Uitrusting","Prijs en opslaan"];
 const set=(key:string,value:string)=>{setForm(s=>({...s,[key]:value}));setNotice("");};
 const input=(key:string,placeholder="",type="text")=><input value={form[key]||""} onChange={e=>set(key,e.target.value)} type={type} placeholder={placeholder}/>;
 const select=(key:string,values:string[])=><select value={form[key]||""} onChange={e=>set(key,e.target.value)}><option value="">Selecteer…</option>{values.map(v=><option key={v} value={v}>{v}</option>)}</select>;
 const next=()=>{if(step===0&&(!form.make?.trim()||!form.model?.trim())){setNotice("Kies een merk en vul een model in.");return;}
 if(step===1&&(!form.year||!form.mileage_km||Number(form.year)<1900||Number(form.year)>2100||Number(form.mileage_km)<0)){setNotice("Vul een geldig bouwjaar en kilometerstand in.");return;}
 setNotice("");setStep(s=>Math.min(3,s+1));};
 const back=()=>{setNotice("");setStep(s=>Math.max(0,s-1));};
 return <section className="portal-card portal-editor-card">
 <div className="portal-editor-heading"><div><span className="portal-overline">VOORRAADBEHEER</span><h2>{vehicleId?"Voertuig bewerken":"Auto toevoegen"}</h2></div><a href="/portal" className="portal-text-link">Terug naar voorraad</a></div>
 <ol className="portal-wizard-steps" aria-label="Stappen">{steps.map((label,i)=><li key={label} aria-current={step===i?"step":undefined} className={i===step?"current":i<step?"complete":""}><span>{i+1}</span>{label}</li>)}</ol>
 <form action={action} className="portal-form portal-wizard">
 {vehicleId&&<input type="hidden" name="vehicle_id" value={vehicleId}/>}
 {Object.entries(form).map(([key,val])=><input type="hidden" key={key} name={key} value={val}/>)}
 {chosen.map(value=><input type="hidden" key={value} name="options" value={value}/>)}
 {step===0&&<div className="portal-fields">
  <label>Merk *<input value={form.make||""} onChange={e=>{set("make",e.target.value);setForm(old=>({...old,make:e.target.value,model:"",version:""}));}} list="portal-makes" placeholder="Zoek een automerk" autoComplete="off"/><datalist id="portal-makes">{makes.map(m=><option key={m} value={m}/>)}</datalist></label>
  <label>Model *<input value={form.model||""} onChange={e=>set("model",e.target.value)} list="portal-models" placeholder="Kies of typ het model"/><datalist id="portal-models">{(modelSuggestions[form.make]||[]).map(m=><option key={m} value={m}/>)}</datalist></label>
  <label>Uitvoering{input("version","Bijv. M Sport, Style, AMG Line")}</label>
  <label>Staat{select("condition",["Nieuw","Tweedehands","Demowagen","Oldtimer","Schadevoertuig"])}</label>
  <p className="portal-note portal-full">Niet elk model of elke uitvoering zit al in de suggestielijst. In dat geval kunt u het correct zelf invoeren.</p>
 </div>}
 {step===1&&<div className="portal-fields">
  <label>Bouwjaar *{input("year","Bijv. 2022","number")}</label>
  <label>Kilometerstand (km) *{input("mileage_km","Bijv. 62000","number")}</label>
  <label>Brandstof{select("fuel",["Benzine","Diesel","Elektrisch","Hybride","Plug-in hybride","LPG","CNG","Waterstof","Overig"])}</label>
  <label>Versnellingsbak{select("transmission",["Automaat","Manueel","Semi-automaat"])}</label>
  <label>Carrosserie{select("body_type",["SUV","Berline","Hatchback","Break","Coupé","Cabrio","Monovolume","Bestelwagen","Pick-up","Andere"])}</label>
  <label>Aandrijving{select("drivetrain",["Voorwielaandrijving","Achterwielaandrijving","Vierwielaandrijving"])}</label>
  <label>Zitplaatsen{select("seats",Array.from({length:10},(_,i)=>String(i+1)))}</label>
  <label>Deuren{select("doors",["2","3","4","5","6"])}</label>
  <label>Vermogen (pk){input("power_hp","Bijv. 150","number")}</label>
  <label>Emissieklasse{select("emission_class",["Euro 6e","Euro 6d","Euro 6","Euro 5","Euro 4","Euro 3","Elektrisch / n.v.t."])}</label>
  <label>Kleur exterieur{select("color",["Zwart","Wit","Grijs","Zilver","Blauw","Rood","Groen","Bruin","Beige","Goud","Andere"])}</label>
  <label>Kleur interieur{select("interior_color",["Zwart","Grijs","Beige","Bruin","Andere"])}</label>
  <label>Eerste inschrijving{input("first_registration","MM/JJJJ")}</label>
  <label>Chassisnummer (optioneel){input("vin","VIN")}</label>
 </div>}
 {step===2&&<div>
  <p className="portal-note">Kies de opties waarover het voertuig daadwerkelijk beschikt.</p>
  <div className="portal-options">{equipment.map(opt=><label key={opt}><input type="checkbox" checked={chosen.includes(opt)} onChange={e=>setChosen(s=>e.target.checked?[...s,opt]:s.filter(v=>v!==opt))}/>{opt}</label>)}</div>
  <label>Extra informatie<textarea value={form.description||""} onChange={e=>set("description",e.target.value)} rows={4} placeholder="Bijkomende informatie…"/></label>
 </div>}
 {step===3&&<div className="portal-fields">
  <label>Verkoopprijs (€) *{input("price_eur","Bijv. 19990","number")}</label>
  <label>Intern stocknummer{input("source_ref","Bijv. STOCK-001")}</label>
  <label className="portal-checkline portal-full"><input type="checkbox" checked={form.vat_deductible==="on"} onChange={e=>set("vat_deductible",e.target.checked?"on":"")}/> BTW aftrekbaar</label>
  <div className="portal-wizard-summary portal-full"><strong>Controleer uw invoer</strong><p>{form.make||"Merk"} {form.model||"Model"} {form.version||""} · {form.year||"Bouwjaar"} · {form.mileage_km||"—"} km · {Number(form.price_eur||0).toLocaleString("nl-BE",{style:"currency",currency:"EUR"})}</p><small>Het voertuig wordt in uw privévoorraad opgeslagen, niet meteen op een publieke marktplaats geplaatst. Foto's voegt u na het opslaan toe.</small></div>
 </div>}
 {(notice||state.error)&&<p className="portal-form-error" role="alert">{notice||state.error}</p>}
 <div className="portal-wizard-controls">{step>0?<button type="button" className="portal-secondary" onClick={back}>Vorige stap</button>:<span/>}{step<3?<button type="button" className="portal-primary" onClick={next}>Verder</button>:<button type="submit" disabled={pending||!form.price_eur} className="portal-primary">{pending?"Opslaan…":vehicleId?"Wijzigingen bewaren":"Voertuig opslaan"}</button>}</div>
 </form></section>;
}
