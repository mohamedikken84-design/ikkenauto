"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {loadInitialCatalog,type EquipmentItem} from "@/lib/dealer/catalog-client";

const fuelOptions=["Benzine","Diesel","Elektrisch","Hybride","Plug-in hybride","LPG","CNG","Waterstof"];
export function DealerInventoryFilters({q,status,fuel,equipment,minYear,maxYear,minPrice,maxPrice,maxMileage,body,transmission}:{q:string;status:string;fuel:string;equipment:string;minYear:string;maxYear:string;minPrice:string;maxPrice:string;maxMileage:string;body:string;transmission:string}){
 const [features,setFeatures]=useState<EquipmentItem[]>([]);
 useEffect(()=>{
  let active=true;
  loadInitialCatalog().then(v=>{if(active)setFeatures(v.equipment)}).catch(()=>{});
  return ()=>{active=false};
 },[]);
 const active=Boolean(q||status||fuel||equipment||minYear||maxYear||minPrice||maxPrice||maxMileage||body||transmission);
 return <form className="dealer-stock-filters" action="/portal" method="get" role="search">
  <input type="hidden" name="tab" value="voertuigen"/>
  <label className="dealer-search-field" htmlFor="dealer-search-stock">
   <span>Merk, model of stocknummer</span>
   <input id="dealer-search-stock" name="q" type="search" maxLength={60} defaultValue={q}
    placeholder="Bijv. BMW X5" autoComplete="off"/>
  </label>
  <label className="dealer-search-status" htmlFor="dealer-stock-status">
   <span>Voorraadstatus</span>
   <select id="dealer-stock-status" name="status" defaultValue={status}>
    <option value="">Alle statussen</option>
    <option value="draft">Concept</option><option value="ready">Klaar voor lancering</option><option value="sold">Verkocht</option>
   </select>
  </label>
  <label className="dealer-search-status" htmlFor="dealer-stock-fuel">
   <span>Brandstof</span>
   <select id="dealer-stock-fuel" name="fuel" defaultValue={fuel}>
    <option value="">Alle brandstoffen</option>
    {fuelOptions.map(x=><option value={x} key={x}>{x}</option>)}
   </select>
  </label>
  <label className="dealer-search-field" htmlFor="dealer-stock-feature">
   <span>Uitrustingskenmerk</span>
   <select id="dealer-stock-feature" name="equipment" defaultValue={equipment} key={equipment+"-"+features.length}>
    <option value="">Alle uitrusting</option>
    {equipment&&!features.some(x=>x.code===equipment)&&<option value={equipment}>Geselecteerde optie</option>}
    {features.map(item=><option key={item.code} value={item.code}>{item.label_nl}</option>)}
   </select>
  </label>
  <details className="dealer-stock-advanced-search">
   <summary>Meer filters: prijs, jaar, kilometerstand en carrosserie</summary>
   <div className="dealer-stock-advanced-grid">
    <label><span>Bouwjaar vanaf</span><input type="number" name="minYear" min="1900" max="2100" defaultValue={minYear} placeholder="Bijv. 2020"/></label>
    <label><span>Bouwjaar tot</span><input type="number" name="maxYear" min="1900" max="2100" defaultValue={maxYear} placeholder="Bijv. 2026"/></label>
    <label><span>Prijs vanaf (€)</span><input type="number" name="minPrice" min="0" max="100000000" defaultValue={minPrice} placeholder="Bijv. 10000"/></label>
    <label><span>Prijs tot (€)</span><input type="number" name="maxPrice" min="0" max="100000000" defaultValue={maxPrice} placeholder="Bijv. 45000"/></label>
    <label><span>Maximale kilometerstand</span><input type="number" name="maxMileage" min="0" max="5000000" defaultValue={maxMileage}/></label>
    <label><span>Carrosserie</span><select name="body" defaultValue={body}>
     <option value="">Alle carrosserieën</option>{["SUV","Berline","Hatchback","Break","Coupé","Cabrio","Monovolume","Bestelwagen","Pick-up","Camper","Andere"].map(x=><option value={x} key={x}>{x}</option>)}
    </select></label>
    <label><span>Versnellingsbak</span><select name="transmission" defaultValue={transmission}>
     <option value="">Alle transmissies</option>{["Manueel","Automaat","Semi-automaat","DSG","CVT","Andere"].map(x=><option value={x} key={x}>{x}</option>)}
    </select></label>
   </div>
  </details>
  <button className="dealer-filter-button" type="submit">Zoeken</button>
  {active&&<Link className="dealer-clear-filters" href="/portal?tab=voertuigen">Filters wissen</Link>}
 </form>;
}
